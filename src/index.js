var ZLog     = require( 'zlog' )
var zlog     = new ZLog()

module.exports = {
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
