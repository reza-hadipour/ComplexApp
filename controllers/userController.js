const User = require('../models/User');
const Post = require('../models/Post');

module.exports.register = async function(req,res,next){
    let user = new User(req.body);
    user.register()
    .then(newUser=>{
        req.session.user = newUser;
        req.session.save(()=>{
            res.redirect('/');
        })
    })
    .catch(err=>{
        req.flash('regErrors',err);
        req.session.save(()=>{
            res.redirect('/');
        })
    })
}

module.exports.login = async function(req,res,next){
    let user = new User(req.body);
    user.login()
    .then((user)=>{
        req.session.user = user;
        req.session.save(()=>{
            res.redirect('/');
        })
    })
    .catch(err=>{
        req.flash('errors',err);
        req.session.save(()=>{
            res.redirect('/');
        })
    })
}

module.exports.logout = function(req,res,next){
    req.session.destroy(()=>{
        res.redirect('/');
    })
}

module.exports.mustBeLoggedIn = function(req,res,next){
    if(req.session.user){
        next();
    }else{
        req.flash('errors','You must be logged in.')
        req.session.save(()=>{
            res.redirect('/');
        })
    }
}

module.exports.ifUserExists = function(req,res,next){
    User.ifUserExists(req.params.username)
    .then(async (user)=>{
        // Get user's post
        let posts = await Post.getPostByAuthorId(user.userId);
        user.posts = posts;
        user.isVisitorOwner = (user.userId).equals(req.visitorId);
        req.userProfile = user;
        next();
    }).catch(err=>{
        console.log(err);
        res.render('404')
    });
}

module.exports.showProfile = function(req,res,next){
    res.render('profile',{userProfile: req.userProfile})
}

module.exports.home = function(req,res,next){
    if(req.session.user){
        res.render('home-dashboard');
    }else{
        res.render('home-guest',{'regErrors': req.flash('regErrors')});
    }
}

module.exports.followUser = async (req,res)=>{
    let userFollowRequestId = req.userProfile.userId.toHexString();
    
    if(userFollowRequestId != req.session.user.userId){
        //Check if visitor follow the User or not
        User.follow(req.visitorId,userFollowRequestId)
        .then((result)=>{
            console.log(result);
            req.flash('success',`You followed ${req.userProfile.username} successfully`);
            req.session.save(()=>{
                res.redirect(`/profile/${req.userProfile.username}`);
            })
        })
        .catch((err)=> {
            req.flash('errors',err);
            req.session.save(()=>{
                res.redirect(`/profile/${req.userProfile.username}`);
            })
        });
    }else{
        req.flash('errors','You can`t follow your self.')
        req.session.save(()=>res.redirect(`/profile/${req.userProfile.username}`))
    }
}

