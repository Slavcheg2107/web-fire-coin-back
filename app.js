const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectID;
const uri = "mongodb+srv://fire:Sync913n@cluster0-rdct6.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, {useNewUrlParser: true});
const app = express();
const jsonParser = express.json();
const WebSocketServer = new require('ws');
const BFX = require('bitfinex-api-node');
const bfx = new BFX({
  apiKey: '1zy6hV34MYvq5Gn6Pqmtvff8sMIbs1l3tO5BQUVj5nG',
  apiSecret: 'UGzn7da23ShkMF5jl6yjx66omXtrbSFtyZKIFXai3Ty',
  ws: {
    autoReconnect: true,
    seqAudit: true,
    packetWDDelay: 10 * 1000
  }
});
let dbClient;

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

const bfxRest1 = bfx.rest(1, {});
const bfxRest2 = bfx.rest(2, {});
const ws = bfx.ws();
var clients = [];

// WebSocket-сервер на порту 8081
var webSocketServer = new WebSocketServer.Server({
  port: 8081
});
webSocketServer.on('connection', function (ws) {
  var id = Math.random();
  clients.push(ws);
  console.log("новое соединение " + id);

  ws.on('close', function () {
    console.log('соединение закрыто ' + id);
    delete clients[id];
  });
});



// TIMER
let allCur = [];
bfxRest1.get_symbols((err2, res2) => {
  if (err2) console.log(err2);
  allCur = res2.map(cur => 't' + cur.toUpperCase());
  setInterval(()=>{
    bfxRest2.tickers(res2.map(cur => 't' + cur.toUpperCase()), (err3, res3) => {
      let table = [];
      for (let i = 0; i < res3.length; i += 1) {
        let t = res3[i];
        if(t[0] !== 'tBTCF0:USTF0' && t[0] !== 'tETHF0:USTF0') {
          table.push(
            {
              'symbol': t[0].slice(1),
              'bid': t[1],
              'bidSize': t[2],
              'ask': t[3],
              'askSize': t[4],
              'dailyChange': t[5],
              'dailyChangePerc': t[6],
              'lastPrice': t[7],
              'volume': t[8],
              'high': t[9],
              'low': t[10]
            })
        }
      }
      let res = {
        type: 'web.currency',
        data: table
      }
      clients.forEach(i => i.send(JSON.stringify(res)));
    });
  }, 3500);
});




app.use(express.static(__dirname + "/page"));

client.connect((err, client) => {
  dbClient = client;
  app.locals.collection = client.db("tasksDB").collection("listTask");
  app.listen(3000, function () {
    console.log("Сервер ожидает подключения...");
  });
});


app.get("/api/balances/", function (req, res) {
  bfxRest1.wallet_balances((err2, res2) => {
    if (err2) console.log(err2)
    res.send(res2);
  });
});

app.get("/api/curseAll/", function (req, res) {
  bfxRest1.get_symbols((err2, res2) => {
    if (err2) console.log(err2);
    bfxRest2.tickers(res2.map(cur => 't' + cur.toUpperCase()), (err3, res3) => {
      let table = [];
      for (let i = 0; i < res3.length; i += 1) {
        let t = res3[i];
        if(t[0] !== 'tBTCF0:USTF0' && t[0] !== 'tETHF0:USTF0') {
          table.push(
            {
              'symbol': t[0].slice(1),
              'bid': t[1],
              'bidSize': t[2],
              'ask': t[3],
              'askSize': t[4],
              'dailyChange': t[5],
              'dailyChangePerc': t[6],
              'lastPrice': t[7],
              'volume': t[8],
              'high': t[9],
              'low': t[10]
            })
        }
      }
      res.send(table);
    });
  });

});

app.get("/api/tasks", function (req, res) {
  const collection = req.app.locals.collection;
  collection.find({}).toArray(function (err, tasks) {

    if (err) return console.log(err);
    res.send(tasks.reverse())
  });
});

app.get("/api/tasks/:id", function (req, res) {
  console.log(req.headers['x-access-token']);
  const id = new objectId(req.params.id);
  const collection = req.app.locals.collection;
  collection.findOne({_id: id}, function (err, task) {

    if (err) return console.log(err);
    res.send(task.reverse());
  });
});

app.post("/api/tasks", jsonParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const name = req.body.name;
  const date = req.body.date;
  const complete = req.body.complete;
  const task = {name, date, complete};
  const collection = req.app.locals.collection;
  collection.insertOne(task, function (err, result) {
    if (err) return console.log(err);
    res.send(task);
  });
});

app.put("/api/tasks", jsonParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const id = new objectId(req.body._id);
  const name = req.body.name;
  const date = req.body.date;
  const complete = req.body.complete;
  const task = {name, date, complete};

  const collection = req.app.locals.collection;
  collection.findOneAndUpdate({_id: id}, {$set: task},
    {returnOriginal: false}, function (err, result) {

      if (err) return console.log(err);
      const taskRes = result.value;
      res.send(taskRes);
    });
});

app.delete("/api/tasks/:id", function (req, res) {
  const id = new objectId(req.params.id);
  const collection = req.app.locals.collection;
  let taskRes;
  collection.findOneAndDelete({_id: id}, function (err, result) {
    if (err) return console.log(err);
    taskRes = result.value;
    res.send(taskRes);
  });

  clients.forEach(i => i.send(req.params.id));
});

process.on("SIGINT", () => {
  dbClient.close();
  process.exit();
});
