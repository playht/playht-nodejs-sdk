import { Request, Response } from 'express';
import * as PlayHT from 'playht';

export async function uploadInstantClone(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const voiceName: string | undefined = req.body.voiceName;
  if (!voiceName) {
    return res.status(400).send('Voice name is missing.');
  }

  const fileBuffer = req.file.buffer;

  try {
    // Call the API
    const clonedVoice = await PlayHT.clone(voiceName, fileBuffer);

    res.status(200).json(clonedVoice);
  } catch (error: any) {
    res.statusMessage = error?.message;
    res.status(error?.status || 500).send();
  }
}
