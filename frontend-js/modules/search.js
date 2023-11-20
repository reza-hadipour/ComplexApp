import axios from 'axios'

export default class Search{
    
    constructor(){
        this.injectHTML();
        
        this.headerSearchIcon = document.querySelector(".header-search-icon");
        this.overlay = document.querySelector(".search-overlay");
        this.closeIcon = document.querySelector(".close-live-search");

        this.inputField = document.querySelector("#live-search-field");
        this.loaderIcon = document.querySelector(".circle-loader");
        this.resultArea = document.querySelector(".live-search-results")

        this.typingWaitTimer;
        this.previousValue = "";

        this.events();
    }

    events(){
      this.closeIcon.addEventListener("click", () => this.closeOverlay())

      this.headerSearchIcon.addEventListener("click", (e) => {
        e.preventDefault()
        this.openOverlay()
      })

      this.inputField.addEventListener('keyup',()=> this.keyPressHandler())

      this.hideLoaderIcon();
      this.hideResultsArea();
    }

    keyPressHandler(){
      let value = this.inputField.value;

      if (value == ""){
        clearTimeout(this.typingWaitTimer);
        this.hideLoaderIcon();
        this.hideResultsArea();
      }

      if (value != "" && value != this.previousValue){
        clearTimeout(this.typingWaitTimer);
        this.showLoaderIcon();
        this.hideResultsArea();
        // Ask to request
        this.typingWaitTimer =  setTimeout(()=>this.sendRequest(),500);
      }
      this.previousValue = value;
      // console.log(value);
    }

    sendRequest(){
      axios.post('/search',{'searchItem' : this.previousValue})
      .then(result => {
        // Show data result
        // console.log('sendRequest: ',result.data)
        this.renderResultHtml(result.data);
      })
      .catch(err=>{
        // console.log('send Request catch: ' ,err);
        alert("Hello, the request failed.");
      })
    }

    renderResultHtml(posts){
      if(posts.length){
        this.resultArea.innerHTML = `<div class="list-group shadow-sm">
        <div class="list-group-item active"><strong>Search Results</strong> (${ posts.length > 1 ? `${posts.length} items` : '1 item'} found)</div>

        ${posts.map(post => {
          let postDate = new Date(post.createdDate);
          return `<a href="/post/${post._id}" class="list-group-item list-group-item-action">
          <img class="avatar-tiny" src="https://gravatar.com/avatar/b9216295c1e3931655bae6574ac0e4c2?s=128"> <strong>${post.title}</strong>
          <span class="text-muted small">by ${post.author.username} on ${postDate.getDate()}/${postDate.getMonth()+1}/${postDate.getFullYear()}</span>
          <br><span class="text-muted small">${post.body}... <span class="text-primary">Read More</span></span>
          </a>`
        }).join('')}
        </div>`
      }else{
        this.resultArea.innerHTML = `<p class="alert alert-danger text-center shadow-sm">Sorry, we could not find any results for that search.</p>`
      }

      this.hideLoaderIcon();
      this.showResultsArea();

    }


    showLoaderIcon(){
      this.loaderIcon.classList.add("circle-loader--visible");
    }

    hideLoaderIcon(){
      this.loaderIcon.classList.remove("circle-loader--visible");
    }

    showResultsArea(){
      this.resultArea.classList.add("live-search-results--visible");
    }

    hideResultsArea(){
      this.resultArea.classList.remove("live-search-results--visible");
    }

    openOverlay(){
      this.overlay.classList.add("search-overlay--visible");
      setTimeout(() => { this.inputField.focus() }, 50);
      this.inputField.value = "";
      this.hideResultsArea();
    }

    closeOverlay(){
      this.overlay.classList.remove("search-overlay--visible")
    }

    injectHTML(){
        document.body.insertAdjacentHTML('beforeend',`<!-- search feature begins -->
        <div class="search-overlay ">
          <div class="search-overlay-top shadow-sm">
            <div class="container container--narrow">
              <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
              <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
              <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
            </div>
          </div>
      
          <div class="search-overlay-bottom">
            <div class="container container--narrow py-3">
              <div class="circle-loader circle-loader--visible"></div>
              <div class="live-search-results live-search-results--visible">
                
      
                  <a href="#" class="list-group-item list-group-item-action">
                    <img class="avatar-tiny" src="https://gravatar.com/avatar/b9216295c1e3931655bae6574ac0e4c2?s=128"> <strong>Example Post #1</strong>
                    <span class="text-muted small">by barksalot on 0/14/2019</span>
                  </a>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- search feature end -->`)
    }
}