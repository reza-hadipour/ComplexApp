const userCollection = require('../db').collection('users');
const validator = require('validator');
const bcrypt = require('bcrypt');
const {ObjectId} = require('mongodb');

let User = function(data){
    this.data = data;;
    this.followings = [];
    this.countOfFollowings = 0;
    this.errors = [];
}

User.prototype.cleanUp = function(){
    if(typeof(this.data.username) != "string") this.data.username = "";
    if(typeof(this.data.email) != "string") this.data.email = "";
    if(typeof(this.data.password) != "string") this.data.password = "";

    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function() {
    return new Promise(async (resolve,reject)=>{
            if( this.data.username == "") this.errors.push('You must provide a username.')
            if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)) this.errors.push('Username can only contain letters and numbers.');
            if(this.data.username.length > 0 && this.data.username.length < 3) this.errors.push('Username must be at least 3 characters.')
        
            if(!validator.isEmail(this.data.email)) this.errors.push('You must provide a valid email address.');
        
            if(this.data.password == "") this.errors.push('You must provide a password');
            if(this.data.password.length > 0 && this.data.password.length < 5 ) this.errors.push('Password must be at least 6 characters.')

            if(this.data.username.length > 2 && validator.isAlphanumeric(this.data.username)){
                let usernameExists = await userCollection.findOne({'username': this.data.username});
                if(usernameExists) this.errors.push('That username is already taken.')
            }

            if(validator.isEmail(this.data.email)){
                let emailExists = await userCollection.findOne({'email': this.data.email})
                if(emailExists) this.errors.push('That email is already being used.')
            }

            resolve();
    })
}

User.prototype.register = async function(){
    // Step 1
    // Validate Data
    this.cleanUp();
    await this.validate();
    
    // Step 2
    // Insert into database if there is no error
    return new Promise((resolve,reject)=>{
        if(this.errors.length){
            reject(this.errors);
        }else{
            userCollection.insertOne({
                'username':this.data.username,
                'email': this.data.email,
                'password': bcrypt.hashSync(this.data.password,10),
                'followings' : this.followings,
                'countOfFollowings' : this.countOfFollowings,
            }).then(info=>{
                resolve({
                    userId: info.insertedId,
                    username: this.data.username,
                    email: this.data.email
                })
            })
            .catch(err=>{
                reject('Try again later.');
            })
        }
    })
}


User.prototype.login = async function(){
    this.cleanUp();

    return new Promise((resolve,reject)=>{
        userCollection.findOne({'username': this.data.username}).then(async user=>{
            if(user && bcrypt.compareSync(this.data.password,user.password)){
                resolve({
                    'userId': user._id,
                    'username': user.username,
                    'email': user.email,
                    'followings' : user.followings,
                    'countOfFollowings' : user.countOfFollowings,
                });
            }else{
                reject('Login Failed.');
            }
        })
    })

}

User.ifUserExists = async function(username){
    return new Promise(async (resolve,reject)=>{
        let user = await userCollection.findOne({'username': username});
        if(user){
            // user.password = undefined;
            user.userId = user._id;
            delete user._id;
            delete user.password;
            
            // user = {
            //    'userId': user._id,
            //    'username': user.username,
            //    'email': user.email,
            //    'followings' : user.followings,
            //    'countOfFollowings' : user.countOfFollowings,
            // };
            // console.log(user);
            resolve(user);
        }else{
            reject('User profile not found')
        }
    })
    
}

User.followAction = function(requesterUserId,targetUserId, operation  = 'follow'){
    return new Promise(async (resolve, reject) => {
        // console.log('requesterUserId: ',requesterUserId);
        let user = await userCollection.findOne({_id: new ObjectId(requesterUserId)});
        // console.log('Follow function: ', user);
        if(user){
            let followings = new Set(user.followings);
            let incValue = 1;

            if(operation == 'follow'){
                if(followings.has(targetUserId)){
                    reject('You have followed this already.')
                    return
                }else{
                    incValue = 1;
                    followings.add(targetUserId)
                }
            }else{
                if(!followings.has(targetUserId)){
                    reject('You have unfollowed this already.')
                    return
                }else{
                    incValue = -1;
                    followings.delete(targetUserId)
                }
            }

            let result =  await userCollection.updateOne({_id: new ObjectId(requesterUserId)},{$set: {followings : [...followings]}, $inc:{ "countOfFollowings" : incValue} })
            // console.log(result);
            if(result.modifiedCount){
                resolve('success');
            }else{
                reject('failed');
            }
        }else{
            reject('failed');
        }
    });
}

User.listOfFollowers = function(userId){
    return new Promise(async(resolve,reject)=>{
        // Users who followed current user
        let followers = await userCollection.find({'followings': userId}).toArray();
        let followersData =  followers.map((follower)=>{
            // console.log(follower.username);
            return {
                userId : follower._id,
                username: follower.username
            }
        })
        resolve([...followersData]);
    })
}

User.countOfFollowers = function(userId){
    return new Promise(async(resolve,reject)=>{
        // Users who followed current user
        let followers = await userCollection.countDocuments({'followings': userId});
        resolve(followers);
    })
}

User.listOfFollowings = function(userIds){
    return new Promise(async(resolve,reject)=>{
        // Users who followed profile
        let followings = await userCollection.find({_id : {$in: userIds}}).toArray();
        let followingsData =  followings.map((following)=>{
            return {
                userId : following._id,
                username: following.username
            }
        })
        resolve([...followingsData]);
    })
}

module.exports = User;