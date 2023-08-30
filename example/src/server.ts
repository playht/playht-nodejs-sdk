import express from 'express';
import textToSpeech from './textToSpeech';
import streamSpeech from './streamSpeech';
import listVoices from './listVoices';
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

app.post('/textToSpeech', textToSpeech);
app.get('/listVoices', listVoices);
app.get('/streamSpeech', streamSpeech);
app.use('/', express.static('public'));

app.listen(3000, () => {
  console.log('PlayHT-API-Example app is listening on port 3000.');
});
