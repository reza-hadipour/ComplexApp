const postCollection = require('../db').collection('posts');
const ObjectId = require('mongodb').ObjectId;
const sanitizeHtml = require('sanitize-html');

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
        title: sanitizeHtml(this.data.title.trim(),{allowedTags : ['i','b','u']}),
        body: sanitizeHtml(this.data.body.trim(), {allowedTags : ['br','p','strong','i','b','u','ul','il','h1','h2','h3','h4','h5','h6'],allowedClasses: { 'p' : ['text-danger','text-success'], 'i' : ['text-primary']}}),
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

Post.deleteById = function(postId,visitorId){
    return new Promise(async (resolve,reject)=>{
        try {
            let post = await Post.getPostById(postId,visitorId);
            if(post.isVisitorOwner){
                postCollection.deleteOne({_id: new ObjectId(postId)}).then(info=>{
                    if(info.deletedCount){
                        resolve("success");
                    }else{
                        reject("failed")
                    }
                }).catch(err=>{
                    reject(err);
                });
            }else{
                reject('You don`t have permission to perform this action.')
            }
            
        } catch (error) {
            reject(error);
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
            Post.reusablePostQuery([
                {$match: {'author': new ObjectId(authorId)}},
                {$sort: {'createdDate' : -1}}
            ])
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

Post.reusablePostQuery = function(uniqueOperation,visitorId, secondOperation = []){
    return new Promise(async (resolve,reject)=>{
        let aggOperations = uniqueOperation.concat([{$lookup: {from: 'users', localField: 'author', foreignField: '_id', as: 'postAuthor'}},
        {$project: {
            'title': 1,
            'body': 1,
            'createdDate': 1,
            authorId : "$author",
            author: {$arrayElemAt : ['$postAuthor',0]}}
        }
]).concat(secondOperation);

        let posts = await postCollection.aggregate(aggOperations).toArray();
        
        if(posts.length){
            posts.map((post=>{
                post.isVisitorOwner = post.authorId.equals(visitorId);
                post.authorId = undefined // After above line there is no need to send AuthorID 
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

Post.search = function(searchItem){
    return new Promise(async(resolve,reject)=>{
        if( typeof(searchItem) == "string" ){
            let cleanSearchItem = sanitizeHtml(searchItem);
            Post.reusablePostQuery([
                {$match: {$text: {$search: cleanSearchItem}}},
            ], undefined , [{$sort: {score: {$meta: "textScore"}}}])
                .then(posts=>resolve(posts))
                .catch(err => reject(err));
        }else{
            reject()
        }
    })
}


module.exports = Post;