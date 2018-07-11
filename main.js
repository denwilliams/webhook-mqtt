#!/usr/bin/env node

const express = require('express');
const mqttusvc = require('mqtt-usvc');
const bodyParser = require('body-parser');

const service = mqttusvc.create();

const app = express();

app.use((req, res, next) => {
  const authorization = req.headers.authorization || '';
  const token = authorization.replace('Bearer ', '') || req.query.token;

  if (!service.config.tokens.includes(token)) {
    res.status(403).send('Invalid token');
    return;
  }

  next();
});

app.use(bodyParser.json());

service.config.hooks.forEach(h => {
  app[h.method](h.path, (req, res) => {
    console.log(`${h.path} => ${h.topic}`);
    service.send(h.topic, h.message === undefined ? req.body : h.message, { retain: false });
    res.status(200).send('OK');
  });
});

app.listen(service.config.port);

