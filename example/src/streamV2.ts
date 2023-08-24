import { NextFunction, Request, Response } from 'express';
import PlayHTAPI from '../../dist';

async function streamV2(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.PLAYHT_API_KEY;
  const userId = process.env.PLAYHT_USER_ID;

  const { text } = req.query;

  if (!text || typeof text !== 'string') {
    res.status(400).send('Text to generate not provided in the request');
    return next();
  }

  if (!apiKey || !userId) {
    res.status(400).send('API key and User ID need to be set.');
    return next();
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  try {
    // Call the API
    const api = new PlayHTAPI(apiKey, userId);
    await api.streamUltraRealisticSpeech(text, 'arthur', res);
  } catch (error: any) {
    res.statusMessage = error?.message;
    res.status(error?.status || 500).send();
  }
  next();
}

export default streamV2;
