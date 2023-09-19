import express from 'express';
import dotenv from 'dotenv';
import { streamGptResponse } from './streamGptSentences';
dotenv.config();

const app = express();
const PORT = 5040;

app.post('/say-prompt', async (req, res) => {
  try {
    const prompt = 'In a few sentences, what is the meaning of life?';

    for await (const sentence of streamGptResponse(prompt)) {
      console.log('Sentence:', sentence);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
