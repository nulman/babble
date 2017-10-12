var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var util = require('util')
var messegesClass = require('./messages-util.js');
console.log('starting server...');
if(process.argv[2] == 'start'){
    var app = express();

    //setup middleware and app generals
    app.use(bodyParser.json());
    //app.use(bodyParser.urlencoded({ extended: false }));
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });
    app.set('messegesContainer', messegesClass);

    //routing
    app.options('*', getOptions);
    app.get('/messages', getMessages);
    app.post('/messages', postMessages);
    app.delete('/messages/:id', deleteMessages);
    app.all(/messages/, badRequest);

    app.get('/stats', getStats);
    app.all(/stats/, badRequest);   


    app.listen(9000, function () {
      console.log('app server listening on port 9000!')
    })


    function getMessages(req, res, next){
        //validate request
        if((typeof(req.query.counter) != 'undefined') && isNaN(req.query.counter)){
            res.sendStatus(400);
            return;
        }
        //get messeges
        var messegesContainer = req.app.get("messegesContainer");
        //return messeges
        
        newMesseges = messegesContainer.getMessages(req.query.counter);
        if(newMesseges.length){
            res.send(newMesseges);
        }else{
            req.setTimeout(0);
            messegesContainer.enqueuePeer(res, req.query.counter);
        }
        
    }


    function postMessages(req, res, next){
        var messegesContainer = req.app.get("messegesContainer");
        var currentId = messegesContainer.addMessage(req.body);
        res.send([currentId]);
        messegesContainer.cyclePeers();
    }



    function deleteMessages(req, res, next){
        var id = req.params['id'];
        if(isNaN(id)){
            console
            next();//fall through to method not allowed
            return;
        }
        var messegesContainer = req.app.get("messegesContainer");
        messegesContainer.deleteMessage(id);
        res.sendStatus(200);
    }


    function getStats(req, res, next){
        var messegesContainer = req.app.get("messegesContainer");
        res.send(messegesContainer.getStats());
    }
    function badRequest(req, res, next){
        console.log("bad request: " + req.method + "\t" + req.originalUrl);
        res.sendStatus(405);
    }

    function getOptions(req, res, next){
        res.sendStatus(204);
    }

    //module.exports = app;
}
//front-end server
var fes = express();

fes.get('/', getMainPage);
fes.use('/', express.static(path.join(__dirname , '..' , 'client')));
function getMainPage(req, res, next){
    res.sendFile(path.join(__dirname , '..' , 'client', 'index.html'));
}
fes.listen(8080, function () {
  console.log('app listening on port 8080!')
})

//test server
if(process.argv[2] == 'test'){
    var ts = express();
    ts.get('/test/client', getClientTest);
    ts.use('/test/client', express.static(path.join(__dirname , '..' ,  'test', 'client')));
    function getClientTest(req, res, next){
        res.sendFile(path.join(__dirname , '..' , 'test' , 'client', 'index.html'));
    }
    ts.listen(8081, function () {
      console.log('app tests on port 8081!')
    })
}
