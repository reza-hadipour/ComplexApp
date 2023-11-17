const postCollection = require('../db').collection('posts');
const ObjectId = require('mongodb').ObjectId;

let Post = function(data,authorId = null, requestedId = null){
    this.data = data
    this.data.author = authorId;
    this.errors = [];
    this.requestedId = requestedId;
}

Post.prototype.cleanUp = function(){
    if(typeof(this.data.title) != 'string') this.data.title = "";
    if(typeof(this.data.body) != 'string') this.data.body = "";

    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
        createdDate: new Date(),
        author: new ObjectId(this.data.author)
    }
}

Post.prototype.validate = function(){
    return new Promise((resolve,reject)=>{
        if(!ObjectId.isValid(this.data.author)) this.errors.push('AuthorId is not valid.')
        if(this.data.title == "") this.errors.push('Title must be provided.')
        if(this.data.title.length < 3) this.errors.push('Title must be at least 3 characters.')
        if(this.data.body == "") this.errors.push('Body must be provided.')
        if(this.data.body.length < 3) this.errors.push('Body must be at least 3 characters.')
        resolve();
    })
}

Post.prototype.createPost = function(){
    return new Promise(async (resolve,reject)=>{
        this.cleanUp();
        await this.validate()

        if(this.errors.length){
            reject(this.errors)
        }else{
            postCollection.insertOne({...this.data}).then((info)=>{
                resolve(info);
            }).catch((err)=>{
                reject(err);
            });
        }
    })
}

Post.prototype.update = function(){
    return new Promise(async (resolve,reject)=>{
        try {
            let post = await Post.getPostById(this.requestedId,this.data.author)
            if(post.isVisitorOwner){
                // actually update the db
                let status = await this.actuallyUpdate();
                resolve(status);
            }else{
                reject()
            }
        } catch (error) {
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function(){
    return new Promise(async (resolve,reject)=>{
        this.cleanUp();
        await this.validate();

        if(!this.errors.length){
            await postCollection.findOneAndUpdate({_id: new ObjectId(this.requestedId)},{$set: {title: this.data.title , body: this.data.body}})
            resolve("success")
        }else{
            resolve("failure")
        }
    })
}

Post.getPostById = function(postId,visitorId){
    return new Promise(async (resolve,reject)=>{
        if(typeof(postId) == "string" && ObjectId.isValid(postId)){
                Post.reusablePostQuery([{$match: {'_id': new ObjectId(postId)}}],visitorId)
                .then((posts)=>{
                    resolve(posts[0]);
                })
                .catch(err=>{
                    reject(err);
                })
        }else{
            reject('Invalid postId');
        }
    })
}

Post.getPostByAuthorId = function(authorId){
    return new Promise(async (resolve,reject)=>{
        if(ObjectId.isValid(authorId)){
            Post.reusablePostQuery([{$match: {'author': new ObjectId(authorId)}}])
            .then((posts)=>{
                resolve(posts);
            })
            .catch(err=>{
                reject(err);
            })
        }else{
            reject('Invalid AuthorId');
        }
    })
}

Post.reusablePostQuery = function(uniqueOperation,visitorId){
    return new Promise(async (resolve,reject)=>{
        let aggOperations = uniqueOperation.concat([{$lookup: {from: 'users', localField: 'author', foreignField: '_id', as: 'postAuthor'}},
        {$project: {
            'title': 1,
            'body': 1,
            'createdDate': 1,
            authorId : "$author",
            author: {$arrayElemAt : ['$postAuthor',0]}
        }}]);

        let posts = await postCollection.aggregate(aggOperations).toArray();
        
        if(posts.length){
            posts.map((post=>{
                post.isVisitorOwner = post.authorId.equals(visitorId);
                post.author = {
                    authorId: post.author._id,
                    username: post.author.username,
                    email: post.author.email
                }
                return post;
            }));
            
            resolve(posts);
        }else{
            reject('Post not found.')
        }
    });
}


module.exports = Post;