const amqp_helper = require('./index')
const util = require('util')

// Just expoert promisified functions
module.exports = {

    connect: util.promisify(amqp_helper.connect),        
    
    sendWithResponseQueue: util.promisify(amqp_helper.sendWithResponseQueue)

}    
