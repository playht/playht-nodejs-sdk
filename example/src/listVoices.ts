import { NextFunction, Request, Response } from 'express';
import * as PlayHTAPI from '@playht/playht-nodejs-sdk';

async function listVoices(req: Request, res: Response, next: NextFunction) {
  res.set('Content-Type', 'application/json');
  try {
    // Call the API
    const voices = await PlayHTAPI.listVoices();

    res.status(200).json(voices);
  } catch (error: any) {
    res.statusMessage = error?.message;
    res.status(error?.status || 500).send();
  }
  next();
}

export default listVoices;
