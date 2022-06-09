const amqp_helper = require('./index')


module.exports = {

    connect: function(uri) {
        return new Promise((resolve, reject) => {
            amqp_helper.connect(uri, (err, conn) => {
                if (err) reject(err)
                resolve(conn)
            })
        })
    },
    
    sendWithResponseQueue: function(connection, queueOut, queueIn, body) {
        return new Promise((resolve, reject) => {
            amqp_helper.sendWithResponseQueue(connection, queueOut, queueIn, body, (err, result) => {
                if (err) reject(err)
                resolve(result)
            })
        })
    }

}    
