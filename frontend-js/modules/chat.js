export default class Chat{
    socket;
    privateChat;
    chatIsShow;
    receiver;

    constructor(){
        this.openedYet = false;
        this.chatIsShow = false
        this.privateChat = false;
        this.chatWrapper = document.querySelector("#chat-wrapper")
        this.openIcon = document.querySelector(".header-chat-icon");
        this.receiverUserId = document.getElementById("receiver-user-id").value;
        this.senderUserId = document.getElementById("sender-user-id").value;
        this.injectHTML();
        this.chatLog = document.querySelector("#chat")
        this.chatField = document.querySelector("#chatField")
        this.chatForm = document.querySelector("#chatForm")
        this.closeIcon = document.querySelector(".chat-title-bar-close")
        // this.userIdField = document.querySelector("#userId");
        this.events();
        this.openConnection();
        this.listenForIncomingMessages();

    }

    // Event
    events(){
        this.chatForm.addEventListener("submit",(e)=>{
            e.preventDefault()
            // Send message to server
            this.sendMessageToServer()
        })
        this.openIcon.addEventListener("click",()=>{this.showChat()})
        this.closeIcon.addEventListener("click", () => this.hideChat())

        
        // this.socket = io();
        // this.counter = 1;
        // // setTimeout(()=>this.sayHelloToServer(),3000);
        // this.setListener();
        // setInterval(() => {
        //     this.sayHelloToServer();
        // }, 10000);
    }

    // Methods

    showChat(){
        if(!this.openedYet){
            // this.openConnection()
            this.startPrivateChat();
        }
        this.openedYet = true;

        this.showChatForDisplay();
    }

    showChatForDisplay(){
        if(!this.chatIsShow){
            this.chatWrapper.classList.add("chat--visible")
            this.chatField.focus();
            this.chatIsShow = true;

        }
    }

    hideChat(){
        this.chatIsShow = false;
        this.openedYet = false;
        this.chatWrapper.classList.remove("chat--visible")
    }

    openConnection(){
        this.socket = io();

        // Store this socket Id in onlineUser list in server side
        this.socket.emit('saveMe', this.senderUserId);

        // this.socket.on("welcome", data => {  // changed  
        //     this.username = data.username
        // })

        // this.socket.emit('saveMe', this.senderUserId);

        // this.socket.on('welcome',(data)=>{
        //     console.log(data);

        //     // this.socket.emit("privateChatReq",({'receiver':this.receiverUserId})); // changed
        // })

        // this.socket.on('privateMessage',(data)=>{
        //     console.log(`Received Private Message: ${data.text}`);
        //     let text = `(pv) [${data.sender}]: ${data.text}`;
        //     this.displayMessageFromServer({text})
        // })

        // this.socket.emit('joinRoom', this.receiverUserId);   // changed

        // this.socket.on("chatMessageFromServer", (data)=>{
        // this.socket.on(this.senderUserId, (data)=>{
        //     this.displayMessageFromServer(data)
        // })

        // this.socket.on(this.receiverUserId, (data)=>{
        //     this.displayMessageFromServer(data)
        // })

        this.socket.on('newMessage', (message) => {
            console.log(`Received message: ${message.text}`);
            
            // Update the UI with the new message
            this.displayMessageFromServer(message)
          
          });
    }

    startPrivateChat(){
        // Send request to start private chat
        this.socket.emit("privateChatReq",({'sender': this.senderUserId,'receiver':this.receiverUserId}));
    }

    listenForIncomingMessages(){
        this.socket.on('privateMessage',(data)=>{
            console.log(`Received Private Message: ${data.text}`);
            let text = `(pv) [${data.sender}]: ${data.text}`;
            this.showChatForDisplay()
            this.displayMessageFromServer({text})
        })

        this.socket.on('startPrivateChatResp',(message)=>{
            // Chat starter get this
            this.privateChat = true
            this.receiver = message.receiver;
            // console.log('this.privateChat turn true - listenForIncomingMessages() -> startPrivateChat');

            console.log(`Pv started from ${message.receiver}`);
            // this.sendPrivateMessageRequest();
        })

        this.socket.on('startPrivateChat',(message)=>{
            // Chat target this one
            this.privateChat = true
            this.receiver = message.sender;
            console.log('this.privateChat turn true - listenForIncomingMessages() -> startPrivateChat');

            console.log(`Pv started from ${message.sender}`);
            // this.sendPrivateMessageRequest();
        })
        
        this.socket.on('privateChatError',(message)=>{
            this.privateChat = false;
            console.log('this.privateChat turn false - listenForIncomingMessages() -> privateChatError');

            console.error('Private Chat Error: ',message);
            this.hideChat();
            // this.chatWrapper.classList.remove("chat--visible")
            // this.openedYet = false;
        })
    }

    // sendPrivateMessageRequest() {
    //     this.socket.emit("privateChatReq",({'sender': this.senderUserId,'receiver':this.receiverUserId}));
    // }

    displayMessageFromServer(data){
        this.chatLog.insertAdjacentHTML('beforeend',`
        <div class="chat-other">
            <a href="/profile/"><img class="avatar-tiny" src=""></a>
            <div class="chat-message"><div class="chat-message-inner">
            <a href="/profile/"><strong>User:</strong></a>
            ${data.text}
            </div></div>
        </div>
        `)
        this.chatLog.scrollTop = this.chatLog.scrollHeight
    }
    // displayMessageFromServer(data){
    //     this.chatLog.insertAdjacentHTML('beforeend',`
    //     <div class="chat-other">
    //         <a href="/profile/${data.username}"><img class="avatar-tiny" src=""></a>
    //         <div class="chat-message"><div class="chat-message-inner">
    //         <a href="/profile/${data.username}"><strong>${data.username}:</strong></a>
    //         ${data.message}
    //         </div></div>
    //     </div>
    //     `)
    //     this.chatLog.scrollTop = this.chatLog.scrollHeight
    // }

    sendMessageToServer(){
        // this.socket.emit("chatMessageFromBrowser", {message: this.chatField.value})
        // this.socket.emit(this.receiverUserId, {sender: this.senderUserId ,message: this.chatField.value})

        // this.socket.emit('privateMessage',"Hello","user1");
        console.log('isPrivate :', this.privateChat);
        this.socket.emit('chatMessage', {isPrivate: this.privateChat ,sender: this.senderUserId ,receiver: this.receiver ,text: this.chatField.value})
        // this.socket.emit('chatMessage', {room: this.receiverUserId ,text: this.chatField.value}) // changed
        this.chatLog.insertAdjacentHTML('beforeend',`
        <div class="chat-self">
            <div class="chat-message">
                <div class="chat-message-inner">
                    ${this.chatField.value}
                </div>
            </div>
            <img class="chat-avatar avatar-tiny" src="${this.avatar}">
        </div>
        `)
        this.chatLog.scrollTo = this.chatLog.scrollHeight
        this.chatField.value = ''
        this.chatField.focus()
    }


    // sayHello(){
    //     this.socket.on('655b75c3f7ba4b886d59aeaa',(data)=>{
    //         console.log('Server said: welcome');
    //     })
    // }

    // sayHelloToServer(){ 
    //     //send to jim
    //     this.socket.emit('655c71909d367dd0ec37b364',{message: `${++this.counter}`, username: 'reza', userId: '655b75c3f7ba4b886d59aeaa'});
    // }
    
    // setListener(){
        // receive from jim
    //     // my name is reza
    //     this.socket.on('655b75c3f7ba4b886d59aeaa',(data)=>{
    //         console.log(`${data.username}: ${data.message} (${data.userId})`);
    //     })
    // }

    // getBroadcastedMessages(){
    //     this.socket.on('getting',(data)=>{
    //         console.log(`Server said: ${data.message}`);
    //     })
    // }

    injectHTML(){
        this.chatWrapper.innerHTML = `
    <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
    <div id="chat" class="chat-log"></div>
    
    <form id="chatForm" class="chat-form border-top">
      <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
    </form>
    `
  }
}