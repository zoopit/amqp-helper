var should = require( 'should' )
var assert = require( 'assert' )

var helper = require( '../src/index' )

describe( 'Module' , function() {
	it( 'Should have function sendWithResponseQueue' , function( done ){
		helper.should.have.property('sendWithResponseQueue')
		done()
	})


    	it( 'Should have function sendWithResponseQueueNew' , function( done ){
		helper.should.have.property('sendWithResponseQueueNew')
		done()
	})

})
