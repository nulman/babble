var crypto = require('crypto');

var messages = 
{
    "messageList" : [],
    "rollingIds" : 1,
    "clientPoll" : [],
    "usersWaiting" : 0
}


/* Adds a message to the list and returns its id */
messages.addMessage = function(message){
    message.id = this.rollingIds;
    if(message.name == null){
        message.name = 'anonymous';
    }
    if(message.email == null){
        message.email = '';
        message.emailHash = '';
    }else{
        message.emailHash = crypto.createHash('md5').update(message.email).digest("hex");
    }
    //get timestamp in HH:MM format
    //message.timestamp = new Date().toLocaleTimeString().replace(/:[^:]+$/, '');
    this.messageList.push(message);
    return this.rollingIds++;
}

/*Finds the first newer message and returns all messageList starting with that one,
    or all messageList if no counter is provided*/
messages.getMessages = function(counter){
    if(counter == null || isNaN(counter)){
        counter = 0;
    }
    //var sliceStart = null;
    for(i in this.messageList){
        if(this.messageList[i].id > counter){
            return this.messageList.slice(i);
            break;
        }
    }
    return([]);
}

/*Removes specified message with id (if exists)*/
messages.deleteMessage = function(id){
    for(i in this.messageList){
        if(this.messageList[i].id == id){
            this.messageList.splice(i,1);
            break;
        }
    }
}

/*returns the number of messageList we currently have*/
messages.getMessageCount = function(){
    return this.messageList.length;
}

/*returns the number of peers currently long polling*/
messages.getStats = function(){
    
    //return {'users': this.clientPoll.length, 'messageList': this.messageList.length};
    return {'users': this.usersWaiting, 'messages': this.messageList.length};
}


/*"Enqueues" a peer if there are no new messageList to return*/
messages.enqueuePeer = function(res, lastIdSeen){
    this.clientPoll.push({'res':res, 'lastIdSeen':lastIdSeen})
    this.usersWaiting = this.clientPoll.length;
}

/*goes over the polling peers, answering them if there are new messages, or re-enqueuing(not technically a queue) them*/
messages.cyclePeers = function(){
    var queue = [];
    while(this.clientPoll.length){
        //should help with timing
        var newestMessageId = this.messageList[this.messageList.length -1].id;
        var currentClient = this.clientPoll.pop();
        if(currentClient.lastIdSeen < newestMessageId){
            var newerMessages = this.getMessages(currentClient.lastIdSeen);
            if(! currentClient.res.headerSent){
                currentClient.res.json(newerMessages).end();
            }
        }else{
            queue.push(currentClient)
        }
    }
    //helps with race conditions
    while(queue.length){
        this.clientPoll.push(queue.pop());
    }
}




module.exports = messages;

