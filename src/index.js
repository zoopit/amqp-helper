var amqp     = require( 'amqplib/callback_api' )
var ZLog     = require( 'zlog' )
var zlog     = new ZLog()


module.exports = {

	connect : function( uri , callback ){
		amqp.connect( uri , callback )
	},

	sendWithResponseQueueNew : function( connection , queueOut , queueIn , body , callback ){
		

		var queueOptions = {
			autoDelete : true
		}
		
		var correlationId = new Date().getTime().toString()
		var ctag = null
		
		zlog.info( 'subscribe' , { queue : queueIn , options : queueOptions } )

		connection.createChannel( function( err , ch ){
			if( err ){
				zlog.error( 'Unable to create channel' )
				return callback ( err )
			}
			zlog.info( 'Channel created' )
			ch.assertQueue( queueIn , { durable : true  },  function( err , ok ){
				if( err ){
					zlog.error( 'Unable to assert queue' , { queue : queueIn } )
					return callback( err )
				}
				
				ch.consume( queueIn , function( msg ){					
					if( msg.properties.correlationId != correlationId )
						return

					zlog.info ( 'Response received, clearing ctag', { ctag : ctag } )
					ch.cancel( ctag )
					
					return callback( null , JSON.parse( msg.content.toString() ) )
					
				}, { noAck : true } , function( err , ok ){
					if( err ){
						zlog.error( 'Unable to consume queue' , { queue : queueIn } )
						callback( err )
					}
					ctag = ok.consumerTag
					
					zlog.info ( 'Queue OK, waiting for response message' , { correlationId : correlationId , ctag : ctag} )
					
					ch.assertQueue( queueOut , { durable : false , autoDelete :  true }  , function( err , ok ){
						if( err ){
							zlog.error( 'Unable to assert queue' , { queue : queueOut } )
							return callback( err )
						}
						var options = { replyTo : queueIn , correlationId : correlationId }
						zlog.info ( 'Sending to queue' , { queue : queueOut , options : options } )
						ch.sendToQueue( queueOut , new Buffer( body ) ,  options )
					});					
				});
			});
		});
	},
	/*
	 * Sends message to exclusive Out queue.
	 * Creates listener on In queue
	 * Autocreates correlation id
	 */
	sendWithResponseQueue : function( connection , queueOut , queueIn , body , callback ){
		zlog.info( 'subscribe' , { queue : queueIn } )		
		
		var queueOptions = { 
			autoDelete : true ,
			closeChannelOnUnsubscribe : true
		}
		
		connection.queue( queueIn , queueOptions, function( queue ) {		
			var correlationId = new Date().getTime().toString()		

			zlog.info( 'send' , { queue : queueOut , correlationId : correlationId } )
			
			connection.publish( queueOut , body , 
																		 { replyTo : queueIn,
																			 correlationId : correlationId,
																		 } , function(){})	
			var ctag		
			queue.subscribe( function( message , headers , deliveryInfo) {	
				if( deliveryInfo.correlationId != correlationId )
					return

				zlog.info( 'reply received' , { queue : queueOut , correlationId : correlationId } )
				zlog.info( 'unbscribe' , { queue : queueIn } )

				queue.unsubscribe( ctag )
				
				if( typeof( message.error) != "undefined" ){
					zlog.error( 'message' , { error : message.error } )
					return callback( message.error , null)
				}
				
				return callback( null , message )
			}).addCallback( function( ok ){				
				ctag = ok.consumerTag
			})
		})	
	}
}
