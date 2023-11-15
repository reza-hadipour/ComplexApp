const User = require('../models/User');

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

module.exports.home = function(req,res,next){
    if(req.session.user){
        res.render('home-dashboard',{'username': req.session.user.username});
    }else{
        res.render('home-guest',{'errors': req.flash('errors') , 'regErrors': req.flash('regErrors')});
    }
}