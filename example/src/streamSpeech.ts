import { NextFunction, Request, Response } from 'express';
import * as PlayHTAPI from '../../dist';

export async function streamSpeech(req: Request, res: Response, next: NextFunction) {
  const { text } = req.query;
  const voice = req.body.voiceId || 'florencio';
  const voiceEngine = req.body.VoiceEngine || 'PlayHT1.0';

  if (!text || typeof text !== 'string') {
    res.status(400).send('Text to generate not provided in the request');
    return next();
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  try {
    // Call the API
    await PlayHTAPI.streamSpeech(text, res, { voiceEngine: voiceEngine, voiceId: voice });
  } catch (error: any) {
    res.statusMessage = error?.message;
    res.status(error?.status || 500).send();
  }
  next();
}
