import * as PlayHTAPI from '@playht/playht';
import express from 'express';
import dotenv from 'dotenv';
import { streamGptResponse } from './streamGptSentences.js';
import { audioFromSentences } from './audioFromSentences.js';
dotenv.config();

// Initialize the SDK
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
const PORT = 5040;

app.get('/say-prompt', async (req, res, next) => {
  try {
    const { prompt } = req.query;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).send('ChatGPT prompt not provided in the request');
      return next();
    }

    const gptSentencesStream = streamGptResponse(prompt);

    res.setHeader('Content-Type', 'audio/mpeg');
    await audioFromSentences(gptSentencesStream, res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.use('/', express.static('../client/dist'));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
