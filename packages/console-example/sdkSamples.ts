import * as PlayHT from 'playht';
import dotenv from 'dotenv';
import { playHT20Examples } from './src/playHT20Examples.js';
import { playHT10Examples } from './src/playHT10Examples.js';
import { standardExamples } from './src/standardExamples.js';
import { allVoices } from './src/allVoices.js';

dotenv.config();
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

process.on('unhandledRejection', (error) => {
  console.error('Unhandled error');
  console.error(error);
  process.exit();
});

await allVoices();
await playHT20Examples();
await playHT10Examples();
await standardExamples();

process.exit();
