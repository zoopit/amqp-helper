var amqp     = require( 'amqplib/callback_api' )
var util     = require( 'util' )
var sha1     = require( 'sha1' )

function rand(max){
	return parseInt(Math.random() * max )
}

module.exports = {

	connect : function( uri , callback ){
		amqp.connect( uri , callback )
	},

	sendWithResponseQueue : function( connection , queueOut , queueIn , body , callback ){
		

		var queueOptions = {
			autoDelete : true
		}

		
		var correlationId = sha1(util.format( "%s%s", new Date().getTime().toString(),rand(10000000000000) ))

		var queueInExclusive = queueIn + correlationId
		var ctag = null
		
		if( global.logger ){
			global.logger.info( "AMQP response channel configured" ,{ queue : queueInExclusive , correlationId : correlationId} )
		}
		

		connection.createChannel( function( err , ch ){
			if( err ){
				return callback ( err )
			}
			ch.assertQueue( queueInExclusive , { exclusive : true , durable : false , autoDelete : true  },  function( err , ok ){
				if( err ){
					return callback( err )
				}
				
				ch.consume( queueInExclusive , function( msg ){
					if( !msg )
						return
					
					if( msg.properties.correlationId != correlationId )
						return

					
					ch.deleteQueue( queueInExclusive , {} , function( err , ok ){
						if( err ){
							return callback( err )
						}
						ch.close()
					})
					
					
					return callback( null , JSON.parse( msg.content.toString() ) )
					
				}, { noAck : true } , function( err , ok ){
					if( err ){
						callback( err )
					}
					ctag = ok.consumerTag
					
					
					ch.assertQueue( queueOut , { durable : false , autoDelete :  true }  , function( err , ok ){
						if( err ){
							return callback( err )
						}
						var options = { replyTo : queueInExclusive , correlationId : correlationId }
						ch.sendToQueue( queueOut , new Buffer( JSON.stringify( body ) ) ,  options )
					});					
				});
			});
		});
	}	
}
