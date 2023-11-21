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
        user.isFollowed = (req.session.user.followings.includes(user.userId.toHexString()));
        console.log('in If user exists:', user.userId.toHexString());
        console.log('in If user exists:', user);

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
        User.followAction(req.visitorId,userFollowRequestId,'follow')
        .then((result)=>{
            // Updating req.session.user.followings

            // console.log(result);
            req.session.user.followings.push(userFollowRequestId);
            req.session.user.countOfFollowings += 1;

            req.flash('success',`You followed ${req.userProfile.username} successfully`);
            req.session.save(()=>{
                // console.log('After following updating:', req.session.user);
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

module.exports.unfollowUser = function(req,res){
    let userUnfollowRequestId = req.userProfile.userId.toHexString();

    if(userUnfollowRequestId != req.session.user.userId){
        //Check if visitor follow the User or not
        User.followAction(req.visitorId,userUnfollowRequestId,'unfollow')
        .then((result)=>{
            // Updating req.session.user.followings

            let tempFollowings = new Set([...req.session.user.followings]);
            tempFollowings.delete(userUnfollowRequestId);
            req.session.user.followings = [...tempFollowings]
            req.session.user.countOfFollowings -= 1;

            // console.log(result);
            req.flash('success',`You unfollowed ${req.userProfile.username} successfully`);
            req.session.save(()=>{
                // console.log('After unfollowing updating:', req.session.user);
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
        req.flash('errors','You can`t unfollow your self.')
        req.session.save(()=>res.redirect(`/profile/${req.userProfile.username}`))
    }


}

