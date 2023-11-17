const { ObjectId } = require('mongodb');
const Post = require('../models/Post');


module.exports.showPost = async (req,res,next)=>{
    Post.getPostById(req.params.id, req.visitorId).then((data)=>{
        res.render('post',{post: data});
    }).catch(err=>{
        console.error('Error in finding post:', err);
        res.render('404',{'errors': err})
    })
}

module.exports.showCreatePost = function(req,res,next){
    res.render('create-post',{'errors':req.flash('errors')});
}

module.exports.createPost = async function(req,res,next){
    new Post(req.body, req.session.user.userId).createPost().then((post=>{
        res.redirect(`/post/${post.insertedId}`)
    })).catch(err=>{
        req.flash('errors',err);
        req.session.save(()=>{
            res.redirect('/post/create')
        })
    });
}

module.exports.showEditPost = async function(req,res){
    try {
        let post = await Post.getPostById(req.params.id,req.visitorId);
        if(post.isVisitorOwner){
            res.render('edit-post',{post: post})
        }else{
            // visitor has't permission to edit this post
            req.flash('errors','You don`t have permission to edit this post.')
            req.session.save(()=>{
                res.redirect('/');
            })
        }
    } catch (error) {
        res.render('404');
    }
    
}


module.exports.editPost = function(req,res){

}