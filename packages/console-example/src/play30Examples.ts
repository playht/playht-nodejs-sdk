import * as PlayHT from 'playht';
import fs from 'fs';
import { pipeline } from 'node:stream/promises';

// Play3.0-mini example
export const play30Examples = async () => {
  console.log('Play3.0-mini example');
  console.log('==================');

  // Stream audio from text
  const streamFromText = await PlayHT.stream(
    'This is me streaming from text.',
    {
      voiceEngine: 'Play3.0-mini',
      voiceId: 's3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20a1/jennifersaad/manifest.json',
      outputFormat: 'mp3',
      temperature: 1.2,
      quality: 'high',
      styleGuidance: 16,
      speed: 1.0,
      language: 'english',
    },
  );

  // Create a file stream
  const fileName = 'hello3.0-textStream.mp3';
  const fileStreamForText = fs.createWriteStream(fileName);

  await pipeline(streamFromText, fileStreamForText);

  console.log(`All done! Please check the generated file: ${fs.realpathSync(fileName)}`);
};
