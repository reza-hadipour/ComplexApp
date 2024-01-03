const Socket = require('../models/socket');

module.exports.addNewSocket = async (req,res,next)=>{
    new Socket(req.body.userId,req.body.socketId).addNewSocket()
    .then(info=>res.json(info))
    .catch(err=>res.json(err));
}

module.exports.getSockets = async (req,res,next)=>{
    Socket.getSockets().then(data => {
        // console.log(data);

        let onlineUsers = new Map();

        if(data.length>0){
            data.forEach(item => {
                onlineUsers.set(item.userId,item.socket)
            });
            console.log('onlineUsers: ', onlineUsers);
            return res.json(data);
        }

        return res.json([]);
    })
    .catch(err=>res.json(err))
}

module.exports.getSocketByUserId = async (req,res,next)=>{
    let {userId} = req.query;
    let socket = await Socket.getSocketByUserId(userId);
    
    if(socket){
        return res.json(socket);
    }

    return res.json(null)
}
