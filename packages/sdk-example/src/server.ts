/* eslint-disable no-process-env */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer, { memoryStorage } from 'multer';
import * as PlayHTAPI from 'playht';
import { textToSpeech } from './textToSpeech.js';
import { streamSpeech } from './streamSpeech.js';
import { listVoices } from './listVoices.js';
import { uploadInstantClone } from './uploadInstantClone.js';

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

app.use(cors());

// Configure multer to store the uploaded file in memory
const storage = memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

app.post('/textToSpeech', textToSpeech);
app.get('/listVoices', listVoices);
app.get('/streamSpeech', streamSpeech);
app.post('/uploadInstantClone', upload.single('audioFile'), uploadInstantClone);
app.use('/', express.static('client/dist'));

app.listen(3000, () => {
  console.log(`PlayHT-API-Example server is running on http://localhost:3000`);
});
