const cors = require('cors');
const express = require('express');
const xmlparser = require('express-xml-bodyparser');

const logger = require('./helpers/logger');
const db = require('./database/database.service');
const notFound = require('./controllers/not-found');
const makeExpressCallback = require('./expressCallback');
const authorization = require('./middlewares/authorization');
const processNewChanges = require('./controllers/process-new-changes');

require('dotenv').config();

const port = process.env.SERVER_PORT;

const app = express();

app.use(cors());
app.use(express.json());
app.use(xmlparser());
app.use(express.urlencoded({ extended: true }));

// app.post('/api/token', processNewChanges);
app.post('/api/changes', 
  // authorization,
  processNewChanges);

app.use(makeExpressCallback(notFound));
db.client.connect()
  .then(() => {
    logger.info(`Connected to database.`);

    app.listen(port, () =>  {
      logger.info(`Server started at ${port} port`)
    });

  }).catch(error => {
    console.log(error);
  });

module.exports = app;
