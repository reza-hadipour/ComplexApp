import Search from "./modules/search"
import Chat from  "./modules/chat"

if( document.querySelector("#chat-wrapper")){
    new Chat();
}

new Search();
