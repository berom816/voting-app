var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//User schema
var User = new Schema({
	twitter: {
		id: String,
		displayName: String,
		username: String,
		token:String
	},
    createdPolls: [
        {
            voterIP:[String],
            pollQuestion:String, 
            pollAnswer:[{choice:String, amount:Number}]
        }
    ]
});

module.exports = mongoose.model('User', User);
