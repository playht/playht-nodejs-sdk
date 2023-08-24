import { NextFunction, Request, Response } from 'express';
import PlayHTAPI from '../../dist/index';

async function ttsV1(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.PLAYHT_API_KEY;
  const userId = process.env.PLAYHT_USER_ID;

  if (!req.body?.text) {
    res.status(400).send('Text to generate not provided');
    return next();
  }

  const text = req.body.text;

  if (!apiKey || !userId) {
    res.status(400).send('API key and User ID need to be set.');
    return next();
  }

  res.set('Content-Type', 'application/json');
  try {
    // Call the API
    const api = new PlayHTAPI(apiKey, userId);
    const generated = await api.genereateStandardOrPremiumSpeech([text], 'arthur');

    res.status(200).json(generated);
  } catch (error: any) {
    res.statusMessage = error?.message;
    res.status(error?.status || 500).send();
  }
  next();
}

export default ttsV1;
