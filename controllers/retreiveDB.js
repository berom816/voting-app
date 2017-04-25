var User = require("../models/users.js");
var mongoose = require("mongoose");
// var User = require("./models/users.js");

module.exports.getAllPoll = function(req,res,next){
    User
        .find({})
        .exec(function(err,result){
            if(err) {throw err;}
            
            var holdAllPollQuestions = [];
            for(var a = 0; a<result.length;a++){
                for(var b = 0; b<result[a].createdPolls.length; b++){
                    var objHolder = {
                        pollQuestion:result[a].createdPolls[b].pollQuestion,
                        id:result[a].createdPolls[b]._id.toString()
                    }
                    holdAllPollQuestions.push(objHolder);
                }            
            }
            res.locals.holdResult = holdAllPollQuestions;
            next();
        });
}

module.exports.getUserPolls = function(req,res,next){
    User
        .find({'twitter.id':req.user.twitter.id})
        .exec(function(err,result){
          if(err) {throw err;} 
          
          var userCreatedPolls = [];
          result[0].createdPolls.forEach(function(element){
            var objHolder = {
                pollQuestion:element.pollQuestion,
                id:element._id.toString()
            }
            userCreatedPolls.push(objHolder);
          })
          res.locals.holdPolls = userCreatedPolls; 
          next();
        });
}

module.exports.saveCreatedPoll = function(req,res,next){
    var data = req.body;
    // var answers = data.options
    var holdAnswers = data.options.split('\r\n');
    var holdMap = holdAnswers.map(function(item,index){
        return {
            choice:item, 
            amount:0,
            // id:index
        }
    })
    var sendToDB = {
        voterIP:[],
        pollQuestion:data.title, 
        pollAnswer:holdMap
    }
    
    User
        .findOneAndUpdate({'twitter.id':req.user.twitter.id},{$push:{'createdPolls':sendToDB}}, {new:true})
        .exec(function(err, result){
            if(err) throw err;
            res.locals.pollID = result.createdPolls[result.createdPolls.length-1]._id;
            // console.log(result.userPolls.createdPolls[result.userPolls.createdPolls.length-1]._id);
            next();
        })
}

module.exports.getSpecificPoll = function(id, callback){
    User
        .find({"createdPolls._id":id}, function(err, result){
            if(err){throw err;}
            var foundPoll =  result[0].createdPolls.find(function(element){
                return (element._id.toString()===id);
            });
            callback(null, foundPoll);
        })
}

module.exports.voteOnPoll = function(id, choice, ipAddress, cb){
    User
        .find({"createdPolls._id":id},function(err, result){
            //result is array
            if(err) throw err;
            
            var userVotedOnThisPoll;
            if(choice!==''){
                for(var z = 0; z<result[0].createdPolls.length;z++){
                    if(result[0].createdPolls[z]._id.toString()===id){
                        if(result[0].createdPolls[z].voterIP.indexOf(ipAddress)===-1){
                            userVotedOnThisPoll = false;
                            result[0].createdPolls[z].voterIP.push(ipAddress);
                        }else{
                            userVotedOnThisPoll = true;
                        }  
                    }
                }
            }
            
            var newOption = true;
            if(!userVotedOnThisPoll&&choice!==""){
                for(var a = 0; a<result[0].createdPolls.length;a++){
                    if(result[0].createdPolls[a]._id.toString()===id){
                        for(var b = 0; b<result[0].createdPolls[a].pollAnswer.length;b++){
                            if(result[0].createdPolls[a].pollAnswer[b].choice===choice){
                                result[0].createdPolls[a].pollAnswer[b].amount += 1;
                                newOption = false;
                            }
                        }
                    }
                }
            }
            
            if(newOption && !userVotedOnThisPoll &&choice!==""){
                for(var i = 0;i<result[0].createdPolls.length;i++){
                    if(result[0].createdPolls[i]._id.toString()===id){
                        result[0].createdPolls[i].pollAnswer.push({
                            amount:1,
                            choice:choice
                        })
                    }
                }
            }
            
            result[0].save(function(err,updatedDB){
                // if(err) throw err;
                if(err){throw err;}
                var foundPoll =  result[0].createdPolls.find(function(updatedDB){
                    return (updatedDB._id.toString()===id);
                });
                // console.log('foundPoll', foundPoll);
                var callbackObj = {
                    updatedDB:foundPoll
                }
                if(userVotedOnThisPoll){
                    callbackObj.hadVoted = true;
                    // cb(null, {hadVoted:true});
                    cb(null, callbackObj)
                }else{
                    // cb(null,{hadVoted:false, updatedDB:foundPoll});
                    callbackObj.hadVoted = false;
                    cb(null, callbackObj)
                }
            })
            
            // if(!userVotedOnThisPoll){
            //     cb(null, null);
            // }else{
            //     cb(null, true);
            // }
            
        })
}