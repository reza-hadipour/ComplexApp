const userCollection = require('../db').collection('users');
const validator = require('validator');
const bcrypt = require('bcrypt');


let User = function(data){
    this.data = data;
    this.errors = []
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
                'password': bcrypt.hashSync(this.data.password,10)
            }).then(info=>{
                resolve({
                    _id: info.insertedId,
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
                    'username': user.username,
                    'email': user.email
                });
            }else{
                reject('Login Failed.');
            }
        })
    })

}

module.exports = User;