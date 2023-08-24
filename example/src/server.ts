import express from 'express';
import ttsV2 from './ttsV2.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());

app.post('/ttsV2', ttsV2);
app.use('/', express.static('public'));

app.listen(3000, () => {
  console.log('PlayHT-API-Example app is listening on port 3000.');
});
