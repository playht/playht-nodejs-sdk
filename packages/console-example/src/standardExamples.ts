import * as PlayHT from 'playht';
import { Readable } from 'stream';
import fs from 'fs';

// Standard voices
export const standardExamples = async () => {
  console.log('');
  console.log('Standard voices');
  console.log('===============');

  // Create a test stream
  const textStream = new Readable({
    read() {
      this.push('You can stream ');
      this.push('text right into ');
      this.push('an audio stream!');
      this.push(null); // End of data
    },
  });

  console.log('Streaming from a stream');

  // Stream audio from text
  const streamFromStream = await PlayHT.stream(textStream, { voiceEngine: 'Standard', voiceId: 'en-US-JennyNeural' });

  // Create a file stream
  const fileStreamForStream = fs.createWriteStream('helloStandard-streamFromStream.mp3');

  streamFromStream.pipe(fileStreamForStream);

  await new Promise((resolve) => {
    fileStreamForStream.on('finish', resolve);
  });

  console.log('Streaming from a string');

  // Stream audio from text
  const streamFromText = await PlayHT.stream('Hi there. I am streaming from a string. So easy!', {
    voiceEngine: 'Standard',
    voiceId: 'en-US-JennyNeural',
  });

  // Create a file stream
  const fileStreamForText = fs.createWriteStream('helloStandard-streamText.mp3');

  streamFromText.pipe(fileStreamForText);

  await new Promise((resolve) => {
    fileStreamForText.on('finish', resolve);
  });

  console.log('Generating from a string');

  const text = 'Am I a conversational voice with options?';

  // Generate audio from text
  const generated = await PlayHT.generate(text, {
    voiceEngine: 'Standard',
    voiceId: 'en-US-JennyNeural',
    trimSilence: true,
  });

  // Grab the generated file URL
  const { audioUrl } = generated;

  console.log('The url for the audio file is', audioUrl);

  process.exit();
};
