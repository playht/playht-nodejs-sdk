import { NextFunction, Request, Response } from 'express';
import * as PlayHT from 'playht';

export async function listVoices(req: Request, res: Response, next: NextFunction) {
  res.set('Content-Type', 'application/json');
  try {
    // Call the API
    const voices = await PlayHT.listVoices();

    res.status(200).json(voices);
  } catch (error: any) {
    res.statusMessage = error?.message;
    res.status(error?.status || 500).send();
  }
  next();
}
