const {ObjectId} = require('mongodb');
const socketCollection = require('../db').collection('sockets');

let ChatSocket = function(userId, socketId){
    this.data = {
        userId,
        socket: socketId
    }
    this.error = [];
}

ChatSocket.prototype.addNewSocket = function(){
    return new Promise(async (resolve,reject)=>{
        if(this.error.length){
            reject(this.error);
        }else{
            socketCollection.insertOne({...this.data})
            .then(info=> resolve(info))
            .catch(err=>reject(err));
        }
    })
}

ChatSocket.getSockets = function(){
    return new Promise(async (resolve,reject)=>{
        let sockets = await socketCollection.find().toArray()
        if(sockets.length){
            resolve(sockets);
        }else{
            resolve([]);
        }
    })
}

ChatSocket.getSocketByUserId = function(userId){
    return new Promise(async (resolve,reject)=>{
        let socket = await socketCollection.findOne({userId});
        resolve(socket?.socket)
    })
}


module.exports = ChatSocket;