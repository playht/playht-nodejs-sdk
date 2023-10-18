import * as PlayHT from 'playht';
import { Readable } from 'stream';
import fs from 'fs';

// PlayHT 1.0 voices
export const playHT10Examples = async () => {
  console.log('');
  console.log('PlayHT 1.0 voices');
  console.log('=================');

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
  const streamFromStream = await PlayHT.stream(textStream, { voiceEngine: 'PlayHT1.0', voiceId: 'oliver' });

  // Create a file stream
  const fileStreamForStream = fs.createWriteStream('hello1.0-streamFromStream.mp3');

  streamFromStream.pipe(fileStreamForStream);

  await new Promise((resolve) => {
    fileStreamForStream.on('finish', resolve);
  });

  console.log('Streaming from a string');

  // Stream audio from text
  const streamFromText = await PlayHT.stream('Hi there. I am streaming from a string. So easy!', {
    voiceEngine: 'PlayHT1.0',
    voiceId: 'oliver',
  });

  // Create a file stream
  const fileStreamForText = fs.createWriteStream('hello1.0-streamText.mp3');

  streamFromText.pipe(fileStreamForText);

  await new Promise((resolve) => {
    fileStreamForText.on('finish', resolve);
  });

  console.log('Generating from a string');

  const text = 'Am I a conversational voice with options?';

  // Generate audio from text
  const generated = await PlayHT.generate(text, {
    voiceEngine: 'PlayHT1.0',
    voiceId: 'oliver',
    outputFormat: 'mp3',
    temperature: 1.5,
    quality: 'high',
    speed: 0.8,
  });

  // Grab the generated file URL
  const { audioUrl } = generated;

  console.log('The url for the audio file is', audioUrl);
};
