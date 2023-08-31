import { NextFunction, Request, Response } from 'express';
import * as PlayHTAPI from '@playht/playht-nodejs-sdk';

async function streamSpeech(req: Request, res: Response, next: NextFunction) {
  const { text } = req.query;

  if (!text || typeof text !== 'string') {
    res.status(400).send('Text to generate not provided in the request');
    return next();
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  try {
    // Call the API
    await PlayHTAPI.streamSpeech(text, res);
  } catch (error: any) {
    res.statusMessage = error?.message;
    res.status(error?.status || 500).send();
  }
  next();
}

export default streamSpeech;
