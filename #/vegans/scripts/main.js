Babble = {};
Babble.server = 'localhost';
Babble.XhrReq = function(url, requestType,callback=null, data=null){
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(requestType, url);
    if (callback != null){
        xhr.onload = function(){
            
            var parsedResponse;
            try{
                parsedResponse = JSON.parse(xhr.responseText);
                callback(parsedResponse);
            }catch(e){
                if(requestType == 'DELETE'){
                callback(url.match(/\d+$/)[0]);
                } else{
                    callback();
                    console.log('-E- ' + e.message);
                }
            }
            resolve();
        };
    }   
    xhr.onerror = function(){reject(xhr.statusText); console.log('-E- xhr request failed with status: ' + xhr.status)};
    xhr.setRequestHeader("Content-type",'application/json');
    xhr.send(data);
  });
}

//window.onload = Babble.init();
Babble.lastIdSeen = 0;
Babble.getMessages = async function(counter, callback){
    if(isNaN(counter)){
        counter = 0;
    }
    Babble.XhrReq(`http://${Babble.server}:9000/messages?counter=${counter}`, 'GET', callback)
}

//send a delete request to the server and calls removeMessage on success
Babble.deleteMessage = async function(id, callback){
    if(isNaN(id)){
        return;
    }
    Babble.XhrReq(`http://${Babble.server}:9000/messages/${id}`, 'DELETE', callback).then(Babble.getStats(Babble.updateStats));
}

//remove a messege from the dom
Babble.removeMessage = function(id){
        var element =  document.getElementById(`messageNumber${id}`);
        if(element){
            document.getElementById('chat').removeChild(element);
        }
}

Babble.getStats = async function(callback){
    Babble.XhrReq(`http://${Babble.server}:9000/stats`, 'GET', callback)
}


Babble.updateStats = function(stats){
    if(document.getElementById('message-count')){
        document.getElementById('message-count').innerHTML = stats.messages;
        document.getElementById('user-count').innerHTML = stats.users;
    }
}
//alert("loaded!");
Babble.appendToChatWindow = function(messages){
    var chatWindow = document.getElementById('chat');
    var lastIdSeen;
    var babble = JSON.parse(localStorage.getItem('babble'));
    for(var i in messages){
        var message = messages[i];
        var timestamp = new Date(message.timestamp);
        var timestamp = timestamp.getHours() + ':' + ('0' + timestamp.getMinutes()).substr(-2)
        var hidden;
        if(babble.userInfo.email == message.email && babble.userInfo.email != ''){
            hidden = `<button class='delete'  data-id=${message.id} aria-label="delete_messege" tabindex="1">&times;</button>`;
        }else{
            hidden = '';
        }
        var item = document.createElement('li');
        item.className = 'message-container';
        item.id = `messageNumber${message.id}`;
        //item.innerHTML = `<img src='https://s3.amazonaws.com/37assets/svn/1065-IMG_2529.jpg' class='profile-pic'>
        //<p class='message-id' hidden>${message.id}</p>
        item.innerHTML = `<img src='https://secure.gravatar.com/avatar/${message.emailHash}' class='profile-pic' alt=''>
                    <div tabindex="1" class='message-text'>
                        <cite class='name'>${message.name}</cite>
                        ${hidden}
                        <time class='time'>${timestamp}</time>
                        <br><br>
                        <p class='message-content'>${message.message}</p>
                    </div>`;
        item.getAttribute('data-id')
        if(item.getElementsByClassName('delete')[0]){
            item.getElementsByClassName('delete')[0].addEventListener('click', function(event){
                Babble.deleteMessage(this.getAttribute('data-id'),Babble.removeMessage);
            });
        }
        if(chatWindow){
            chatWindow.append(item);
        }
        Babble.lastIdSeen = Number(message.id);
    }
    document.dispatchEvent(Babble.eventLoop);
    //Babble.getMessages(Number(Babble.lastIdSeen),Babble.appendToChatWindow).then(Babble.getStats(Babble.updateStats));
    
}


Babble.register = function(userInfo){
    var babble = JSON.parse(localStorage.getItem('babble'));
    babble.userInfo = userInfo;
    localStorage.setItem('babble',JSON.stringify(babble));
}

Babble.unregister = function(){
    var babble = JSON.parse(localStorage.getItem('babble'));
    babble.userInfo = {
                'name' : 'Anonymous',
                'email' : ''
            };
    localStorage.setItem('babble',JSON.stringify(babble));
    //make all delete buttons hidden again
}


Babble.postMessage = function(message, callback){
    Babble.XhrReq(`http://${Babble.server}:9000/messages`, 'POST', callback, JSON.stringify(message));
    
}

Babble.sleep = function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Babble.init = function(){
    var regButton = document.getElementById('register-button')
    if(regButton){
        regButton.addEventListener("click", function(event){
            var babble = {
                'userInfo' : {
                    'name' : document.getElementById("reg-name").value,
                    'email' : document.getElementById("reg-email").value
                },
                'currentMessage' : ''
            };
            localStorage.setItem('babble',JSON.stringify(babble));
            var modal = document.getElementById('registration-modal');
            modal.style.display = "none";
        });
    }
    var anonButton = document.getElementById('anonymous-button')
    if(anonButton){
        anonButton.addEventListener("click", function(event){
            var modal = document.getElementById('registration-modal');
            modal.style.display = "none";
        });
    }
    
    if(!('babble' in localStorage)){
        var babble = {
            'userInfo' : {
                'name' : 'Anonymous',
                'email' : ''
            },
            'currentMessage' : ''
        };
        localStorage.setItem('babble',JSON.stringify(babble));
        var modal = document.getElementById('registration-modal');
        modal.style.display = "block";
        //invoke modal
    }
    //var modal = document.getElementById('registration-modal');
    //modal.style.display = "block";
    Babble.localStorage = localStorage.getItem('babble');
    var babble = JSON.parse(localStorage.getItem('babble'));
    if(document.getElementById('message-count')){
        document.getElementById('message-count').innerHTML = 0;
        document.getElementById('user-count').innerHTML = 0;
    }
    var textBox = document.getElementById("val");
    if(textBox){
        textBox.addEventListener('keyup',Babble.cacheMessage);
        textBox.value = babble.currentMessage;
    }
    var submitButton = document.getElementById('submit-button')
    if(submitButton){
        submitButton.addEventListener("click", function(event){
            event.preventDefault();
            //Babble.getMessages(document.getElementById("val").value);
            //Babble.deleteMessage(document.getElementById("val").value);
            textBox.style.height = '70px';
            textBox.setAttribute('style', 'overflow-y:hidden;')
            var babble = JSON.parse(localStorage.getItem('babble'));
            var message = {
                    name: babble.userInfo.name,
                    email: babble.userInfo.email,
                    message: babble.currentMessage,
                    timestamp: Date.now()
                }
            Babble.postMessage(message,Babble.flushMessage);
        });
    }
    Babble.fixCSS();
    var lastIdSeen = 0;
    var i = 0;
    document.addEventListener("get-messages-loop", function(e) {
        Babble.getMessages(Number(Babble.lastIdSeen),Babble.appendToChatWindow).then(Babble.getStats(Babble.updateStats));
    });
    Babble.eventLoop = new CustomEvent("get-messages-loop", { "detail": "self calling event loop" });
    Babble.getMessages(0,Babble.appendToChatWindow);
    //chat = document.getElementById('chat');
    if(lastIdSeen == 0){
        lastIdSeen = 1;
    }
}


Babble.fixCSS = function(){
    var header = document.getElementsByTagName('header');
    if(header[0]){
        var height = (window.innerHeight - header[0].scrollHeight) ;
        document.getElementsByTagName('nav')[0].style.height = height + 'px';
        document.getElementsByClassName('message-board')[0].style.height = (height - document.getElementById('message-input').scrollHeight) + 'px';
    }  
    var tx = document.getElementsByTagName('textarea');
    for (var i = 0; i < tx.length; i++) {
      tx[i].setAttribute('style', 'height:' + (tx[i].scrollHeight) + 'px;overflow-y:hidden;');
      tx[i].addEventListener("input", OnInput, false);
    }

    function OnInput() {
            if(this.scrollHeight >= 300){
            this.setAttribute('style', 'overflow-y:scroll;');
            this.style.height = '300px';
            }else{
            this.setAttribute('style', 'overflow-y:hidden;');
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            }
    }
}



Babble.cacheMessage = function(event){
    var babble = JSON.parse(localStorage.getItem('babble'));
    var key = event.keyCode || event.charCode;
    if(key == 13){
        document.getElementById('submit-button').click();
    }
    babble.currentMessage = document.getElementById("val").value
    localStorage.setItem('babble',JSON.stringify(babble));
}


Babble.flushMessage = function(){
    var babble = JSON.parse(localStorage.getItem('babble'));
    babble.currentMessage = '';
    localStorage.setItem('babble',JSON.stringify(babble));
    document.getElementById("val").value = '';
}


window.onload = function(){Babble.init()};//Babble.getMessages(0,Babble.appendToChatWindow



/*
var item = document.createElement('li');
item.className = 'message-container';
//item.innerHTML = `<img src='https://s3.amazonaws.com/37assets/svn/1065-IMG_2529.jpg' class='profile-pic'>
item.innerHTML = `<img src='https://secure.gravatar.com/avatar/${message.emailHash}' class='profile-pic'>
                    <div class='message-text'>
                        <p class='name'>${message.name}</p>
                        <p class='time'>${message.timestamp}</p>
                        <p class='message-content'>${message.message}</p>
                    </div>`;
var el = document.getElementById('chat');
el.append(item);
*/


/*
http://localhost:9000/messages
{
"message": "what",
"name": "Serge theKrul",
"email": "iwillkissyou@gmail.com"
}*/