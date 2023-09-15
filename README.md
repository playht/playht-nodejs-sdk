<div align="center">
  <a href="https://play.ht">
    <img
      width="200"
      alt="playht logo"
      src="https://github.com/playht/playht-nodejs-sdk/assets/3000200/f6385388-9f7d-4015-b900-f2340cc3fdff"
    />
  </a>
<p></p>
<p>AI Powered Voice Generation Platform</p>

</div>

---

The `playht/playht-nodejs-sdk` library provides easy to use methods that wrap the [PlayHT API](https://docs.play.ht/reference/api-getting-started).

## Getting started

Before you can start using the API, you need to generate an API Secret Key and obtain your User ID. If you already have a PlayHT account, navigate to the [API access page](https://play.ht/app/api-access). For more details [see the API documentation](https://docs.play.ht/reference/api-authentication#generating-your-api-secret-key-and-obtaining-your-user-id).

## Installation

This module is distributed via [npm](https://www.npmjs.com/) and
should be installed as one of your project's dependencies:

```shell
npm install --save @playht/playht-nodejs-sdk
```

or for installation with [yarn](https://yarnpkg.com/) package manager:

```
yarn add @playht/playht-nodejs-sdk
```

# Usage

First you need to set up the library with your API credentials. Import methods from the library and call `init()` with your credentials:

```ts
import * as PlayHTAPI from '@playht/playht-nodejs-sdk';

PlayHTAPI.init({
  apiKey: '<YOUR API KEY>',
  userId: '<YOUR API KEY>',
});
```

**Important:** Keep your API Secret Key confidential. Do not share it with anyone or include it in publicly accessible code repositories.

## Generating Speech

To get an URL with the audio for a generated file using the default settings, call the `generateSpeech()` method with the text you wish to convert.

```ts
import * as PlayHTAPI from '@playht/playht-nodejs-sdk';

// Generate audio from text
const generated = await PlayHTAPI.generateSpeech('Computers can speak now!');

// Grab the generated file URL
const { audioUrl } = generated;

console.log('The url for the audio file is', audioUrl);
```

The output also contains a `generationId` field and an optional `message` field. `generationId` is a unique identifier for the generation request, which can be used for tracking and referencing the specific generation job. The optional `message` field gives additional information about the generation such as status or error messages.

For more speech generation options, see [Generating Speech Options](#generating-speech-options) below.

## Streaming Speech

To stream audio from text using the default settings, call the `streamSpeech()` method with the text you wish to convert and a writable stream where you want the audio bytes to be piped to. For example to write it into a file:

```ts
import * as PlayHTAPI from '@playht/playht-nodejs-sdk';
import fs from 'fs';

// Create a file stream
const fileStream = fs.createWriteStream('hello-playht.mp3');

// Stream audio from text
await PlayHTAPI.streamSpeech('This sounds very realistic.', fileStream);

// Wait for the file to finish writing
await new Promise((resolve) => fileStream.on('finish', resolve));
```

For more speech generation options, see [Generating Speech Options](#generating-speech-options) below.

## Generating Speech Options

Both `generateSpeech()` and `streamSpeech()` methods accept an optional `options` parameter. You can use it to generate audio with different voices, AI models, output file formats and much more. The options available will depend on the AI model that synthesize the selected voice. PlayHT API supports 3 different types of models: 'PlayHT2.0', 'PlayHT1.0' and 'Standard'. For all available options, see the typescript type definitions [in the code](https://github.com/playht/playht-nodejs-sdk/blob/main/src/index.ts).

To generate an audio file using a PlayHT 2.0 voice with options:

```ts
import * as PlayHTAPI from '@playht/playht-nodejs-sdk';

const text = "I'm a conversational voice with options.";

// Generate audio from text
const generated = await PlayHTAPI.generateSpeech(text, {
  voiceEngine: 'PlayHT2.0',
  voiceId: 's3://peregrine-voices/oliver_narrative2_parrot_saad/manifest.json',
  outputFormat: 'mp3',
  temperature: 1.5,
  quality: 'high',
  speed: 0.8,
});

// Grab the generated file URL
const { audioUrl } = generated;

console.log('The url for the audio file is', audioUrl);
```

If you want a PlayHT 1.0 voice instead:

```ts
import * as PlayHTAPI from '@playht/playht-nodejs-sdk';

const text = 'Options are never enough.';

// Generate audio from text
const generated = await PlayHTAPI.generateSpeech(text, {
  voiceEngine: 'PlayHT1.0',
  voiceId: 'susan',
  outputFormat: 'wav',
  temperature: 0.5,
  quality: 'medium',
  seed: 11,
});

// Grab the generated file URL
const { audioUrl } = generated;

console.log('The url for the audio file is', audioUrl);
```

And an example with standard voice in Spanish:

```ts
import * as PlayHTAPI from '@playht/playht-nodejs-sdk';

const text = 'La inteligencia artificial puede hablar español.';

// Generate audio from text
const generated = await PlayHTAPI.generateSpeech(text, {
  voiceEngine: 'Standard',
  voiceId: 'Mia',
  quality: 'low',
  speed: 1.2,
});

// Grab the generated file URL
const { audioUrl } = generated;

console.log('The url for the audio file is', audioUrl);
```

For a full list of available voices and the languages they speak, see [Listing Available Voices](#listing-available-voices)

## Listing Available Voices

To list all available voices in our platform, including voices you cloned, you can call the `listVoices()` method with no parameters:

```ts
import * as PlayHTAPI from '@playht/playht-nodejs-sdk';

// Fetch all available voices
const voices = await PlayHTAPI.listVoices();

// Output them to the console.
console.log(JSON.stringify(voices, null, 2));
```

The `listVoices()` method also takes in an optional parameter to filter the voices by different fields. To get all stock female PlayHT 2.0 voices:

```ts
import * as PlayHTAPI from '@playht/playht-nodejs-sdk';

// Fetch stock female PlayHT 2.0 voices
const voices = await PlayHTAPI.listVoices({
  gender: 'female',
  voiceEngine: ['PlayHT2.0'],
  isCloned: false,
});

// Output them to the console.
console.log(JSON.stringify(voices, null, 2));
```

## Instant Clone a Voice

You can use the `instantCloneFromBuffer()` to create a cloned voice from audio data. The cloned voice is ready to be used straight away.

```ts
import * as PlayHTAPI from '@playht/playht-nodejs-sdk';
import fs from 'fs';

// Load an audio file
const fileBlob = fs.readFileSync('voice-to-clone.mp3');

// Clone the voice
const clonedVoice = await PlayHTAPI.instantCloneFromBuffer('dolly', fileBlob, 'male');

// Display the cloned voice information in the console
console.log('Cloned voice info\n', JSON.stringify(clonedVoice, null, 2));

// Use the cloned voice straight away to generate an audio file
const fileStream = fs.createWriteStream('hello-dolly.mp3');
await PlayHTAPI.streamSpeech('Cloned voices sound realistic too.', fileStream, {
  voiceEngine: clonedVoice.voiceEngine,
  voiceId: clonedVoice.id,
});
await new Promise((resolve) => fileStream.on('finish', resolve));
```

# Example server

This repository contains an [Express](https://expressjs.com/) server implementation example for the API.

To run it locally:

```console
> yarn
> yarn build
> cd example
> yarn
> yarn start
```
