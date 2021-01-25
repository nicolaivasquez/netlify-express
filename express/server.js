'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const Pusher = require("pusher");
const { v4: uuidv4 } = require('uuid');
const cors = require("cors");
const {
  APP_ID,
  APP_KEY,
  APP_SECRET,
  APP_CLUSTER
} = require('../config.json')

const pusher = new Pusher({
  appId: APP_ID,
  key: APP_KEY,
  secret: APP_SECRET,
  cluster: APP_CLUSTER,
  useTLS: true
});

const router = express.Router();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
});
router.get('/another', (req, res) => res.json({ route: req.originalUrl }));

router.post("/pusher/auth", function(req, res) {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

router.post('/pusher/send', (req, res) => {
  const {message, channel} = req.body;
  pusher.trigger(channel, 'message', {
    message,
    id: uuidv4()
  });
  res.sendStatus(200)
});

router.post('/', (req, res) => res.json({ postBody: req.body }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
if (process.env.NODE_ENV === 'development') {
  app.use('/', router)
} else {
  app.use('/.netlify/functions/server', router);  // path must route to lambda
}
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);
