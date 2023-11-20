const { ObjectId } = require('mongodb');
const Post = require('../models/Post');


module.exports.showPost = async (req,res,next)=>{
    Post.getPostById(req.params.id, req.visitorId).then((data)=>{
        res.render('post',{post: data});
    }).catch(err=>{
        req.flash('errors',err);
        req.session.save(()=>{
            res.render('404')
        })
    })
}

module.exports.showCreatePost = function(req,res,next){
    res.render('create-post');
}

module.exports.createPost = async function(req,res,next){
    new Post(req.body, req.session.user.userId).createPost().then((post=>{
        req.flash('success','Post created successfully.')
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
            // res.render('edit-post',{post: post, success: req.flash('success'), errors: req.flash('errors')})
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
    let post = new Post(req.body, req.visitorId, req.params.id);
    post.update().then(status=>{
        if(status == "success"){
            req.flash('success','Post successfully updated.')
            req.session.save(()=>{
                res.redirect(`/post/${req.params.id}`)
            })
        } else {
            req.flash('errors',post.errors)
            req.session.save(()=>{
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    }).catch(()=>{
        // a post with the requested id does't exist
        // or if the current visitor is not the owner of the requested post
        req.flash('errors',"You do not have permission to perform that action.")
        req.session.save(()=>{
            res.redirect('/');
        })
    })
}

module.exports.deletePost = function(req,res){
    Post.deleteById(req.params.id,req.visitorId).then((status)=>{
        if(status == 'success'){
            req.flash('success',"Post deleted successfully.");
            req.session.save(()=>{
                res.redirect(`/profile/${req.session.user.username}`)
            })
        }else{
            req.flash('errors',"Post deleted failed.");
            req.session.save(()=>{
                res.redirect(`/profile/${req.session.user.username}`)
            })
        }
    }).catch((err)=>{
        req.flash('errors',err)
        req.session.save(()=>{
            res.redirect('/');
        })
    });
}

module.exports.searchPost = function(req,res){
    Post.search(req.body.searchItem)
    .then(posts=>res.json(posts))
    .catch((err)=> {
        console.log('Error in searchPost: ', err);
        res.json([]);
    })
}