const Chat = require('../models/chat');

module.exports.showChats = async (req,res,next)=>{
    console.log('clg 1');
    console.log(req.query);
    Chat.getChats(req.query.sender,req.query.receiver)
    .then((data)=>res.json(data))
    .catch(err=>{
        console.log(err);
        res.json(err);
    })
}

module.exports.saveChat = async (req,res,next)=>{
    new Chat(req.body.sender,req.body.receiver,req.body.message).createChat()
    .then((chatInfo)=>res.json(chatInfo))
    .catch(err=>res.json(err))
}