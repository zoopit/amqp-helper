var amqp     = require( 'amqplib/callback_api' )
var ZLog     = require( 'zlog' )
var zlog     = new ZLog()


module.exports = {

	connect : function( uri , callback ){
		amqp.connect( uri , callback )
	},

	sendWithResponseQueueNew : function( connection , queueOut , queueIn , body , callback ){
		zlog.info( 'subscribe' , { queue : queueIn } )

		var queueOptions = {
			autoDelete : true
		}

		var correlationId = new Date().getTime().toString()
		var ctag = null


		connection.createChannel( function( err , ch ){
			if( err )
				return callback ( err )
			ch.assertQueue( queueIn , { durable : true  },  function( err , ok ){
				if( err )
					return callback( err )
				
				ch.consume( queueIn , function( msg ){
					if( msg.properties.correlationId != correlationId )
						return
					
					ch.cancel( ctag )
					
					return callback( null , JSON.parse( msg.content.toString() ) )
					
				}, { noAck : true } , function( err , ok ){
					if( err )
						callback( err )
					
					ctag = ok.consumerTag
					
					ch.assertQueue( queueOut , { durable : false , autoDelete :  true }  , function( err , ok ){
						ch.sendToQueue( queueOut , new Buffer( body ) , { replyTo : queueIn , correlationId : correlationId } )
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
