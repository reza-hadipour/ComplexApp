const { ObjectId } = require('mongodb');
const User = require('../models/User');
const Post = require('../models/Post');


module.exports.ifUserExists = function(req,res,next){
    User.ifUserExists(req.params.username)
    .then(async (user)=>{
        user.isVisitorOwner = (user.userId).equals(req.visitorId);
        user.isFollowed = (req.session.user?.followings.includes(user.userId.toHexString()));
        req.userProfile = user;
        next();
    }).catch(err=>{
        console.log(err);
        res.render('404')
    });
}

module.exports.sharedProfileData = async function(req,res,next){
    let userId = req.userProfile.userId.toHexString();

    let postCountPromise = Post.countPostsByAuthor(userId);
    let countOfFollowersPromise = User.countOfFollowers(userId);
    let listOfFollowersPromise = User.listOfFollowers(userId);

    let [countOfPosts ,countOfFollowers, listOfFollowers] = await Promise.all([postCountPromise, countOfFollowersPromise, listOfFollowersPromise]);

    req.userProfile.countOfPosts = countOfPosts;
    req.userProfile.countOfFollowers = countOfFollowers;
    req.userProfile.followers = listOfFollowers;

    next();
}

module.exports.home = async function(req,res,next){
    if(req.session.user){
        // Getting feed
        // console.log(req.session.user.followings);
        let posts = await Post.getFeed(req.session.user.followings);
        res.render('home-dashboard',{posts});
    }else{
        res.render('home-guest',{'regErrors': req.flash('regErrors')});
    }
}

module.exports.showFollowers = async function(req,res){
    let userId = req.userProfile.userId.toHexString();

    let listOfFollowers = await User.listOfFollowers(userId);
    res.render('profile-followers',{userProfile: req.userProfile, followers: listOfFollowers, profileAction : 'followers'})
}

module.exports.showFollowings = async function(req,res){
    // let userId = req.userProfile.userId.toHexString();

    let followingsId = req.userProfile.followings.map(user=>new ObjectId(user));
    let listOfFollowings = [];

    if(followingsId.length){
        listOfFollowings = await User.listOfFollowings(followingsId);
    }
    res.render('profile-followings',{userProfile: req.userProfile, followings: listOfFollowings, profileAction : 'followings'})
}

module.exports.showProfile = async function(req,res,next){
    // Get user's post
    let posts = await Post.getPostByAuthorId(req.userProfile.userId);
    req.userProfile.posts = posts;
    req.session.save(()=>{
        // console.log('UserProfile: ',req.userProfile);
        res.render('profile',{userProfile: req.userProfile, profileAction : 'posts'})
    })
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

module.exports.getFeed = function(req,res){

}