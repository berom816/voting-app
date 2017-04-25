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
        .get(
            access.getAllPoll, 
            function(req,res){
                // var embedData = {
                //     loggedIn:false,
                //     poll:res.locals.holdResult
                // }
                var embedData = {
                    poll:res.locals.holdResult,
                }
                if(req.user===undefined){
                    embedData.loggedIn = false;
                }else{
                    embedData.loggedIn = true;
                    embedData.username = req.user.twitter.username;
                }
                
                res.render('index',{embedData});
            }
        );
    
    // app.route('/polls')
    //     .get(isLoggedIn, access.getAllPoll, function(req,res){
    //         var embedData = {
    //             loggedIn:true,
    //             poll:res.locals.holdResult, 
    //             username:req.user.twitter.username
    //         }
    //         res.render('auth_index',{embedData});
    //     });
        
    app.route('/mypolls')
        .get(isLoggedIn,access.getUserPolls, function(req,res){
            var embedData = {
                loggedIn:true,
                poll:res.locals.holdPolls, 
                username:req.user.twitter.username
            }
            // console.log('embedData.poll', embedData.poll);
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
                // console.log(pollChoiceAndVotes);
                var embedData = {
                    question:dataResult.pollQuestion,
                    options:pollChoiceAndVotes,
                    pollIDURL:req.params.id,
                    hadVoted:false
                }
                // console.log('embedData', embedData);
                //check if viewing page as a logged in user 
                if(req.user===undefined){
                    embedData.loggedIn = false;
                }else{
                    embedData.loggedIn = true;
                    embedData.username = req.user.twitter.username
                }
                // embedData.loggedIn = (req.user===undefined)?false:true;
                
                res.render('poll', {embedData});
            }, function(errorResponse){
                throw errorResponse;
            })
        })
        .post(urlencodedParser, function(req,res){
            var userChoice;
            if(req.body.userChoice==='userCreatedUnique1776'){
                userChoice = req.body.userOwnOpinion;
            }else{
                userChoice = req.body.userChoice;
            }
            new Promise((resolve, reject)=>{
                access.voteOnPoll(req.params.id, userChoice, req.headers['x-forwarded-for'], function(err,result){
                    if(err){
                        reject(err);
                    }else{
                        resolve(result);
                    }
                })
            }).then(function(dataReturned){
                if(dataReturned.hadVoted===true){
                    var pollChoiceAndVotes = dataReturned.updatedDB.pollAnswer.map(function(element){
                        return [element.choice, element.amount]
                    })
                    var embedData = {
                        question:dataReturned.updatedDB.pollQuestion,
                        options:pollChoiceAndVotes,
                        pollIDURL:req.params.id,
                    }
                    if(req.user===undefined){
                        embedData.loggedIn = false;
                    }else{
                        embedData.loggedIn = true;
                        embedData.username = req.user.twitter.username
                    }
                    embedData.hadVoted = dataReturned.hadVoted;
                    // res.json({status:true})
                    // console.log('embedData.options',embedData.options);
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
        // .get(passport.authenticate('twitter', {
        //     // successRedirect : '/polls',
        //     // successReturnToOrRedirect:'/mypolls',
        //     failureRedirect : '/',
        //     failureFlash : true
        // }), function(req,res){
        //     // res.redirect(req.body.ref_path)
        //     console.log(req);
        // });
        .get(passport.authenticate('twitter', {
            successRedirect:'/', 
            failureRedirect:'/'
        }))
}