import * as PlayHT from 'playht';
import fs from 'fs';

// PlayHT 3.0 example
export const playHT30Examples = async () => {
  console.log('PlayHT 3.0 example');
  console.log('==================');

  // Stream audio from text
  const streamFromText = await PlayHT.stream(
    'Hi there. I am streaming from text. So easy! I will do that again for sure.',
    {
      voiceEngine: 'PlayHT3.0',
      outputFormat: 'mp3',
      temperature: 1.2,
      quality: 'high',
      emotion: 'male_fearful',
      styleGuidance: 16,
    },
  );

  // Create a file stream
  const fileName = 'hello3.0-textStream.mp3';
  const fileStreamForText = fs.createWriteStream(fileName);

  streamFromText.pipe(fileStreamForText);

  await new Promise((resolve) => {
    fileStreamForText.on('finish', resolve);
  });

  console.log(`All done! Please check the generated file: ${fs.realpathSync(fileName)}`);
};
