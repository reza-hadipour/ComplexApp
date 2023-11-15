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
    if( this.data.username == "") this.errors.push('You must provide a username.')
    if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)) this.errors.push('Username can only contain letters and numbers.');
    if(this.data.username.length > 0 && this.data.username.length < 3) this.errors.push('Username must be at least 3 characters.')

    if(!validator.isEmail(this.data.email)) this.errors.push('You must provide a valid email address.');

    if(this.data.password == "") this.errors.push('You must provide a password');
    if(this.data.password.length > 0 && this.data.password.length < 5 ) this.errors.push('Password must be at least 6 characters.')
}

User.prototype.register = function(){
    // Step 1
    // Validate Data
    this.cleanUp();
    this.validate();
    
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
                resolve(info)
            })
            .catch(err=>{
                reject(err);
            })
        }
    })
}


User.prototype.login = async function(){
    this.cleanUp();

    return new Promise((resolve,reject)=>{
        userCollection.findOne({'username': this.data.username}).then(user=>{
            if(user && bcrypt.compareSync(this.data.password,user.password)){
                resolve({
                    'username': user.username,
                    'email': user.email
                });
            }else{
                reject('Login Failed')
            }
        })
    })

}

module.exports = User;