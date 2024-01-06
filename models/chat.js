const chatCollection = require('../db').collection('chats');
const {ObjectId} = require('mongodb');
const sanitizeHtml = require('sanitize-html');

let Chat = function(sender, receiver, msg = null){
    this.data = {
        sender : new ObjectId(sender),
        receiver : new ObjectId(receiver),
        msg : msg.trim(),
        sentDate : new Date()
    }
    this.errors = [];
}

Chat.prototype.validate = function(){
    return new Promise((resolve,reject)=>{
        if(!ObjectId.isValid(this.data.sender)) this.errors.push('Sender Id is not valid')
        if(!ObjectId.isValid(this.data.receiver)) this.errors.push('Receiver Id is not valid')
        if(this.data.msg == "") this.errors.push('Incoming message is empty')
        resolve();
    })
}

Chat.prototype.cleanUp = function(){
    this.data.msg = sanitizeHtml(this.data.msg.trim(),{allowedTags: [], allowedClasses:{}});
}

Chat.prototype.createChat = function(){
    return new Promise(async(resolve,reject)=>{
        this.cleanUp();
        await this.validate();

        if(this.errors.length){
            reject(this.errors)
        }else{
            chatCollection.insertOne({...this.data})
            .then((info)=> resolve(info))
            .catch(err => reject(err))
        }
    })
}

Chat.getChats = function(sender,receiver){
    let chatersId = [new ObjectId(sender),new ObjectId(receiver)];
    return new Promise(async (resolve,reject)=>{
        let chats = await chatCollection.aggregate([
            {$match : 
                {
                $and : [
                    {
                        sender : {
                            $in : [...chatersId] 
                        }
                    },
                    {
                        receiver : {
                            $in : [...chatersId] 
                        }
                    }
                    ]
                }
            },
            {$lookup : {
                from: 'users',
                localField: 'sender',
                foreignField: '_id',
                as: 'chatSender'
                }
            },{
                $unwind : '$chatSender'
            },{
                $lookup:{
                    from: 'users',
                    localField: 'receiver',
                    foreignField: '_id',
                    as: 'chatReceiver'
                }
            },{
                $unwind : '$chatReceiver'
            },{
                $addFields : {
                    senderUsername: "$chatSender.username",
                    receiverUsername: "$chatReceiver.username",
                }
            },{
                $project : {
                    chatReceiver : 0,
                    chatSender : 0,
                }
            },{
                $sort: {
                    sentDate : 1
                }
            }
        ]).toArray();

        resolve(chats)
    })
}

module.exports = Chat;