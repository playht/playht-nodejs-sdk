import express from 'express';
import ttsV1 from './ttsV1';
import ttsV2 from './ttsV2';
import streamV2 from './streamV2';
import streamV1 from './streamV1';
import allVoices from './allVoices';
import dotenv from 'dotenv';
import * as PlayHTAPI from '../../dist/index';

dotenv.config();
PlayHTAPI.init({
  apiKey:
    process.env.PLAYHT_API_KEY ||
    (function () {
      throw new Error('PLAYHT_API_KEY not found in .env file. Please read .env.example to see how to create it.');
    })(),
  userId:
    process.env.PLAYHT_USER_ID ||
    (function () {
      throw new Error('PLAYHT_USER_ID not found in .env file. Please read .env.example to see how to create it.');
    })(),
});

const app = express();

app.use(express.json());

app.post('/ttsV2', ttsV2);
app.post('/ttsV1', ttsV1);
app.get('/allVoices', allVoices);
app.get('/streamV2', streamV2);
app.get('/streamV1', streamV1);
app.use('/', express.static('public'));

app.listen(3000, () => {
  console.log('PlayHT-API-Example app is listening on port 3000.');
});
