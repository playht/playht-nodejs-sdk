import { NextFunction, Request, Response } from 'express';
import * as PlayHT from 'playht';

export async function streamSpeech(req: Request, res: Response, next: NextFunction) {
  const { text } = req.query;
  const voice = req.query.voiceId || 'florencio';
  const voiceEngine = req.query.voiceEngine || 'PlayHT1.0';

  if (!text || typeof text !== 'string') {
    res.status(400).send('Text to generate not provided in the request');
    return next();
  }

  if (
    typeof voice !== 'string' ||
    (voiceEngine !== 'PlayHT2.0' && voiceEngine !== 'PlayHT1.0' && voiceEngine !== 'Standard')
  ) {
    res.status(400).send('Invalid voice params');
    return next();
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  try {
    // Call the API
    const stream = await PlayHT.stream(text, { voiceEngine: voiceEngine, voiceId: voice });
    stream.pipe(res);
  } catch (error: any) {
    res.statusMessage = error?.message;
    res.status(error?.status || 500).send();
  }
  next();
}
