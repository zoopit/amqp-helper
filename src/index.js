var amqp     = require( 'amqplib/callback_api' )
var ZLog     = require( 'zlog' )
var zlog     = new ZLog()
var util     = require( 'util' )

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
		var correlationId = util.format( "%s%s", new Date().getTime().toString(),rand(1000) )
		
		var queueInExclusive = queueIn + correlationId
		var ctag = null
		
		zlog.info( 'subscribe' , { queue : queueInExclusive , options : queueOptions } )

		connection.createChannel( function( err , ch ){
			if( err ){
				zlog.error( 'Unable to create channel' )
				return callback ( err )
			}
			zlog.info( 'Channel created' )
			ch.assertQueue( queueInExclusive , { exclusive : true , durable : false , autoDelete : true  },  function( err , ok ){
				if( err ){
					zlog.error( 'Unable to assert queue' , { queue : queueInExclusive } )
					return callback( err )
				}
				
				ch.consume( queueInExclusive , function( msg ){
					if( !msg )
						return
					
					if( msg.properties.correlationId != correlationId )
						return

					zlog.info ( 'Response received, clearing ctag', { ctag : ctag } )
					
					ch.deleteQueue( queueInExclusive , {} , function( err , ok ){
						if( err ){
							zlog.error( 'Unable to delete queue', { queue : queueInExclusive } )
							return callback( err )
						}
						zlog.info( 'Closed channel'  , { queue : queueInExclusive } )
						ch.close()
					})
					
					
					return callback( null , JSON.parse( msg.content.toString() ) )
					
				}, { noAck : true } , function( err , ok ){
					if( err ){
						zlog.error( 'Unable to consume queue' , { queue : queueInExclusive } )
						callback( err )
					}
					ctag = ok.consumerTag
					
					zlog.info ( 'Queue OK, waiting for response message' , { correlationId : correlationId , ctag : ctag} )
					
					ch.assertQueue( queueOut , { durable : false , autoDelete :  true }  , function( err , ok ){
						if( err ){
							zlog.error( 'Unable to assert queue' , { queue : queueOut } )
							return callback( err )
						}
						var options = { replyTo : queueInExclusive , correlationId : correlationId }
						zlog.info ( 'Sending to queue' , { queue : queueOut , options : options } )
						ch.sendToQueue( queueOut , new Buffer( JSON.stringify( body ) ) ,  options )
					});					
				});
			});
		});
	}	
}
