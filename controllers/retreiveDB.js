var User = require("../models/users.js");
var mongoose = require("mongoose");

//get all the poll questions created from database
module.exports.getAllPoll = function(req,res,next){
    User
        .find({})
        .exec(function(err,result){
            if(err) {throw err;}
            
            var holdAllPollQuestions = [];
            for(var a = 0; a<result.length;a++){
                for(var b = 0; b<result[a].createdPolls.length; b++){
                    var holdQuestionAndIdObj= {
                        pollQuestion:result[a].createdPolls[b].pollQuestion,
                        id:result[a].createdPolls[b]._id.toString()
                    }
                    holdAllPollQuestions.push(holdQuestionAndIdObj);
                }            
            }
            //save it through res to pass to next
            res.locals.holdResult = holdAllPollQuestions;
            next();
        });
}

//get the poll questions the current logged in user had created
module.exports.getUserPolls = function(req,res,next){
    User
        .find({'twitter.id':req.user.twitter.id})
        .exec(function(err,result){
          if(err) {throw err;} 
          
          var userCreatedPolls = [];
          result[0].createdPolls.forEach(function(element){
            var holdPollQuestionAndIdObj = {
                pollQuestion:element.pollQuestion,
                id:element._id.toString()
            }
            userCreatedPolls.push(holdPollQuestionAndIdObj);
          })
          res.locals.holdPolls = userCreatedPolls; 
          next();
        });
}

//save the created poll from user to DB submitted in form
module.exports.saveCreatedPoll = function(req,res,next){
    var data = req.body;
    var tempHoldAnswers = data.options.split('\r\n');
    //filter out the empty lines
    tempHoldAnswers = tempHoldAnswers.filter(function(answer){
        return answer!=='';
    });
    var holdAnswers = [];
    //take only unique choices, disregard duplicate ones
    tempHoldAnswers.forEach(function(answer){
        if(holdAnswers.indexOf(answer)===-1){
            holdAnswers.push(answer);
        }
    });
    
    var holdMap = holdAnswers.map(function(item,index){
        return {
            choice:item, 
            amount:0,
        }
    });
    //package into obj
    var sendToDB = {
        voterIP:[],
        pollQuestion:data.title, 
        pollAnswer:holdMap
    }
    
    //update the user collection with the added poll created
    User
        .findOneAndUpdate({'twitter.id':req.user.twitter.id},{$push:{'createdPolls':sendToDB}}, {new:true})
        .exec(function(err, result){
            if(err) throw err;
            //save the id to res to pass to next
            res.locals.pollID = result.createdPolls[result.createdPolls.length-1]._id;
            next();
        })
}

//get the specific poll from db based on the id provided
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

//increase the poll choice tally by one based on the choice voted
//the choice can be a choice that did not exist in options
module.exports.voteOnPoll = function(id, choice, ipAddress, cb){
    User
        .find({"createdPolls._id":id},function(err, result){
            //result is array
            if(err) throw err;
            
            //flag to tell if user had voted on this poll already
            var userVotedOnThisPoll;
            //if choice is empty, ignore it 
            //else check if this user had voted for this poll already based on the ip address stored
            if(choice!==''){
                for(var z = 0; z<result[0].createdPolls.length;z++){
                    if(result[0].createdPolls[z]._id.toString()===id){
                        if(result[0].createdPolls[z].voterIP.indexOf(ipAddress)===-1){
                            //user had not voted on this poll, store user ip address
                            userVotedOnThisPoll = false;
                            result[0].createdPolls[z].voterIP.push(ipAddress);
                        }else{
                            userVotedOnThisPoll = true;
                        }  
                    }
                }
            }
            
            var newOption = true;
            //if user had not voted on this poll and the option already exist, 
            //increase tally amount of the choice by one
            if(!userVotedOnThisPoll&&choice!==""){
                for(var a = 0; a<result[0].createdPolls.length;a++){
                    if(result[0].createdPolls[a]._id.toString()===id){
                        for(var b = 0; b<result[0].createdPolls[a].pollAnswer.length;b++){
                            //if the choice user chose already in existing options
                            if(result[0].createdPolls[a].pollAnswer[b].choice===choice){
                                result[0].createdPolls[a].pollAnswer[b].amount += 1;
                                newOption = false;
                            }
                        }
                    }
                }
            }
            
            //if the choice user chose is a new option (user created option)
            //add that choice to existing options with 1 vote
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
            
            //save the updated data to DB and get the update DB
            result[0].save(function(err,updatedDB){
                if(err){throw err;}
                
                //get the poll that match the id 
                var foundPoll =  updatedDB.createdPolls.find(function(poll){
                    return (poll._id.toString()===id);
                });
                
                var callbackObj = {
                    updatedPoll:foundPoll
                }
                if(userVotedOnThisPoll){
                    callbackObj.hadVoted = true;
                }else{
                    callbackObj.hadVoted = false;
                }
                cb(null, callbackObj)
            })
        })
}