//require controller
var access = require("./controllers/retreiveDB.js");

var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var Promise = require('promise');


module.exports = function(app, passport){
    function isLoggedIn(req,res,next){
        if (req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/');
		}
    }
    
    app.route('/')
        .get(access.getAllPoll, function(req,res){
                var embedData = {
                    poll:res.locals.holdResult
                }
                //check if viewing as logged in user
                if(req.user===undefined){
                    embedData.loggedIn = false;
                }else{
                    embedData.loggedIn = true;
                    embedData.username = req.user.twitter.username;
                }
                
                res.render('index',{embedData});
            }
        );
        
    app.route('/mypolls')
        .get(isLoggedIn,access.getUserPolls, function(req,res){
            var embedData = {
                loggedIn:true,
                poll:res.locals.holdPolls, 
                username:req.user.twitter.username
            }
            res.render('user_polls.ejs',{embedData});
        });
        
    app.route('/newpoll')
        .get(isLoggedIn,function(req, res) {
            var embedData = { 
                loggedIn:true,
                username:req.user.twitter.username
            }
            res.render('new_polls',{embedData}); 
        })
        .post(isLoggedIn, urlencodedParser, access.saveCreatedPoll, function(req,res){
            var pollIDString = (res.locals.pollID).toString();
            res.redirect('/polls/' + pollIDString);
        })
        
    app.route('/polls/:id')
        .get(function(req,res){
            new Promise((resolve, reject)=>{
                access.getSpecificPoll(req.params.id, function(err, result){
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            }).then(function(dataResult){
                var pollChoiceAndVotes = dataResult.pollAnswer.map(function(element){
                    return [element.choice, element.amount]
                })
                var embedData = {
                    question:dataResult.pollQuestion,
                    options:pollChoiceAndVotes,
                    pollIDURL:req.params.id,
                    hadVoted:false
                }
                //check if viewing as logged in user
                if(req.user===undefined){
                    embedData.loggedIn = false;
                }else{
                    embedData.loggedIn = true;
                    embedData.username = req.user.twitter.username;
                }
                // embedData.loggedIn = (req.user===undefined)?false:true;
                
                res.render('poll', {embedData});
            }, function(errorResponse){
                throw errorResponse;
            })
        })
        .post(urlencodedParser, function(req,res){
            var userChoice;
            /* userCreatedUnique1776 is name of unique choice from submitted form, if matches this unqiue string, 
            then it means user chose to submit their own created opinion
            userchoice should hold the created opinion*/
            if(req.body.userChoice==='userCreatedUnique1776'){
                userChoice = req.body.userOwnOpinion;
            }else{
                userChoice = req.body.userChoice;
            }
            new Promise((resolve, reject)=>{
                //req.headers['x-forwarded-for'] is user's ip address
                access.voteOnPoll(req.params.id, userChoice, req.headers['x-forwarded-for'], function(err,result){
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            }).then(function(dataReturned){
                if(dataReturned.hadVoted===true){
                    var pollChoiceAndVotes = dataReturned.updatedPoll.pollAnswer.map(function(element){
                        return [element.choice, element.amount]
                    })
                    var embedData = {
                        question:dataReturned.updatedPoll.pollQuestion,
                        options:pollChoiceAndVotes,
                        pollIDURL:req.params.id,
                    }
                    //check if viewing as logged in user
                    if(req.user===undefined){
                        embedData.loggedIn = false;
                    }else{
                        embedData.loggedIn = true;
                        embedData.username = req.user.twitter.username;
                    }
                    embedData.hadVoted = dataReturned.hadVoted;
                    res.render('poll', {embedData});
                }else{
                    var nextURL = '/polls/'+req.params.id;
                    res.redirect(nextURL);
                }
            },function(errorResponse){
                throw errorResponse;
            })
        })
    
    app.route('/logout')
        .get(function(req,res){
            req.logout();
            res.redirect('/');
        });
    
    app.route('/auth/twitter')
        .get(passport.authenticate('twitter'));
        
    app.route('/auth/twitter/callback')
        .get(passport.authenticate('twitter', {
            successRedirect:'/', 
            failureRedirect:'/'
        }))
}