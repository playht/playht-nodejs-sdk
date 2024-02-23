import * as PlayHT from 'playht';
import express from 'express';
import dotenv from 'dotenv';
import { streamGptText } from './streamGptText.js';
dotenv.config();

// Initialize the SDK
PlayHT.init({
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

    res.setHeader('Content-Type', 'audio/mpeg');

    // Create a text stream from ChatGPT responses
    const gptStream = await streamGptText(prompt);
    // Generate a stream with PlayHT's API
    const stream = await PlayHT.stream(gptStream, {
      voiceEngine: 'PlayHT2.0-turbo',
      voiceId: 's3://peregrine-voices/oliver_narrative2_parrot_saad/manifest.json',
    });
    stream.pipe(res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.use('/', express.static('../client/dist'));

app.listen(PORT, () => {
  console.log(`PlayHT-GPT-Example server is running on http://localhost:${PORT}`);
});
