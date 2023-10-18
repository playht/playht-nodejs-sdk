import * as PlayHT from 'playht';
import { Readable } from 'stream';
import fs from 'fs';

// PlayHT 2.0 voices
export const playHT20Examples = async () => {
  console.log('PlayHT 2.0 voices');
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
  const streamFromStream = await PlayHT.stream(textStream);

  // Create a file stream
  const fileStreamForStream = fs.createWriteStream('hello2.0-streamFromStream.mp3');

  streamFromStream.pipe(fileStreamForStream);

  await new Promise((resolve) => {
    fileStreamForStream.on('finish', resolve);
  });

  console.log('Streaming from a string');

  // Stream audio from text
  const streamFromText = await PlayHT.stream(
    'Hi there. I am streaming from a string. So easy! I will do that again for sure. Make it a bit longer just to make sure it will work for cloning.',
  );

  // Create a file stream
  const fileStreamForText = fs.createWriteStream('hello2.0-textStream.mp3');

  streamFromText.pipe(fileStreamForText);

  await new Promise((resolve) => {
    fileStreamForText.on('finish', resolve);
  });

  console.log('Generating from a string');

  const text =
    'Am I a conversational voice with options? Make it a bit longer just to make sure it will work for cloning.';

  // Generate audio from text
  const generated = await PlayHT.generate(text, {
    voiceEngine: 'PlayHT2.0',
    voiceId: 's3://peregrine-voices/oliver_narrative2_parrot_saad/manifest.json',
    outputFormat: 'mp3',
    temperature: 1.5,
    quality: 'high',
    speed: 0.8,
    emotion: 'male_fearful',
    styleGuidance: 16,
  });

  // Grab the generated file URL
  const { audioUrl } = generated;
  console.log('The url for the audio file is', audioUrl);

  // Load an audio file
  const fileBlob = fs.readFileSync('hello2.0-textStream.mp3');

  // Clone the voice
  const clonedVoice = await PlayHT.clone('dolly-file', fileBlob, 'male');

  // Display the cloned voice information in the console
  console.log('Cloned voice info\n', JSON.stringify(clonedVoice, null, 2));

  console.log(`Deleting cloned voice ${clonedVoice.name}.`, await PlayHT.deleteClone(clonedVoice.id));

  // Clone another voice
  const clonedFromUrl = await PlayHT.clone('dolly-url', audioUrl, 'male');

  // Display the cloned voice information in the console
  console.log('Cloned from url voice info\n', JSON.stringify(clonedFromUrl, null, 2));

  console.log(`Deleting cloned voice ${clonedFromUrl.name}.`, await PlayHT.deleteClone(clonedFromUrl.id));
};
