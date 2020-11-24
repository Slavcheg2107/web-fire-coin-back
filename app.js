const express = require("express");
const config = require("config");
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const BFX = require('bitfinex-api-node');
const jsonParser = express.json();
const WebSocketServer = new require('ws');

//CONST
const app = express();
const PORT = config.get('port') || 5000;
const WS_PORT = config.get('ws_port') || 8081;
const TIME_UPDATE_WS = config.get('time_update_ws') || 3500;
const bfx = new BFX({
  apiKey: config.get('api_key_bfx'),
  apiSecret: config.get('api_secret_bfx'),
  ws: {
    autoReconnect: true,
    seqAudit: true,
    packetWDDelay: 10 * 1000
  }
});
const bfxRest1 = bfx.rest(1, {});
const bfxRest2 = bfx.rest(2, {});
const BFX_WS = bfx.ws();

//Var
let CLIENTS_WS = [];

//CORS
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});
// Body JSON
app.use(express.json({extended: true}));

// WebSocket-сервер
let allCur = [];
const webSocketServer = new WebSocketServer.Server({
  port: WS_PORT
}, function () {
  console.log("WS start port: " + WS_PORT);
});
webSocketServer.on('connection', function (ws, h) {
  let token = h.url.replace('/?token=', '');
  if (!!token) {
      try {
          const decoded = jwt.verify(token, config.get('jwt_secret'));
          if(decoded){
              const id = decoded.userId;
              CLIENTS_WS.push(ws);
              console.log("новое соединение " + id);
              let resAllCur = {
                  type: 'web.allCur',
                  data: allCur
              };
              ws.send(JSON.stringify(resAllCur));

              ws.on('close', function () {
                  console.log('соединение закрыто ' + id);
                  delete CLIENTS_WS[id];
              });
          }
      } catch (e) {
          ws.close();
      }
  } else {
    ws.close();
  }
});

// TIMER
bfxRest1.get_symbols((err2, res2) => {
  if (err2) console.log(err2);
  allCur = res2.map(cur => cur.toUpperCase());

  setInterval(()=>{
    bfxRest2.tickers(res2.map(cur => 't' + cur.toUpperCase()), (err3, res3) => {
      let table = [];
      for (let i = 0; i < res3.length; i += 1) {
        let t = res3[i];
        if(t[0] !== 'tBTCF0:USTF0' && t[0] !== 'tETHF0:USTF0' && t[0].includes('USD') && !t[0].includes('TEST') ) {
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
      };
      CLIENTS_WS.forEach(i => i.send(JSON.stringify(res)));
    });
  }, TIME_UPDATE_WS);
});

//ROUTES
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/keys', require('./routes/keyUser.routes'));
//app.use('/api/balances', require('./routes/balances.routes'));

//START
async function start(){
  try {
    await mongoose.connect(config.get('mongo_url'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });
    app.listen(PORT, () => {console.log("Сервер ожидает подключения... Port: " + PORT)});
  } catch (e) {
    console.log('Server Error', e.message);
    process.exit(1);
  }
}

start();

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

process.on("SIGINT", () => {
  process.exit();
});
