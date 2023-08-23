import express from 'express';
import ttsV2 from './ttsV2.js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(bodyParser.json());

app.use('/', express.static('public'));

app.post('/ttsV2', ttsV2);

app.listen(3000, () => {
  console.log('Play-API-Example app is listening on port 3000.');
});
