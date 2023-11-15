const User = require('../models/User');

module.exports.register = async function(req,res,next){
    let user = new User(req.body);
    user.register()
    .then(info=>{
        res.json(info)
    })
    .catch(err=>{
        res.json(err);
    })
}

module.exports.login = async function(req,res,next){
    let user = new User(req.body);
    user.login()
    .then((user)=>{
        res.json(user);
    })
    .catch(err=>{
        res.json(err);
    })
}