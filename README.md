<div align="center">
  <a href="https://play.ht">
    <img
      width="200"
      alt="playht playai logo"
      src="https://github.com/user-attachments/assets/c97afbf8-0fe2-4cbb-8d32-9af0ca8901c0"
    />
  </a>
<p></p>
<p>AI Powered Voice Generation Platform</p>

</div>

---

<!--
[![GitHub Actions CI](https://github.com/playht/workflows/CI/badge.svg)](https://github.com/playht/actions?query=workflow%3ACI)
-->

[![npm version](https://badge.fury.io/js/playht.svg)](https://www.npmjs.com/package/playht) [![Downloads](https://img.shields.io/npm/dm/playht.svg)](https://www.npmjs.com/package/playht)


The PlayHT SDK provides easy to use methods to wrap the [PlayHT API](https://docs.play.ht/reference/api-getting-started).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents**

- [Usage](#usage)
  - [Initializing the library](#initializing-the-library)
  - [Generating Speech](#generating-speech)
  - [Streaming Speech](#streaming-speech)
  - [Generating Speech Options](#generating-speech-options)
    - [PlayHT 2.0 Voices](#playht-20-voices)
    - [PlayHT 1.0 Voices](#playht-10-voices)
    - [Standard Voices](#standard-voices)
  - [Listing Available Voices](#listing-available-voices)
  - [Instant Clone a Voice](#instant-clone-a-voice)
    - [Deleting a Cloned Voice](#deleting-a-cloned-voice)
- [SDK Examples](#sdk-examples)
  - [Example Server](#example-server)
  - [ChatGPT Integration Example](#chatgpt-integration-example)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Usage

This module is distributed via [npm](https://www.npmjs.com/) and should be installed as one of your project's dependencies:

```shell
npm install --save playht
```

or for installation with [yarn](https://yarnpkg.com/) package manager:

```shell
yarn add playht
```

## Initializing the library

Before using the SDK, you need to initialize the library with your credentials. You will need your API Secret Key and your User ID. If you already have a PlayHT account, navigate to the [API access page](https://play.ht/studio/api-access). For more details [see the API documentation](https://docs.play.ht/reference/api-authentication#generating-your-api-secret-key-and-obtaining-your-user-id).

_**Important:** Keep your API Secret Key confidential. Do not share it with anyone or include it in publicly accessible code repositories._

Import methods from the library and call `init()` with your credentials to set up the SDK:

```javascript
import * as PlayHT from 'playht';

PlayHT.init({
  apiKey: '<YOUR API KEY>',
  userId: '<YOUR API KEY>',
});
```

**_Note: All the examples below require that you call the init() method with your credentials first._**

When initializing the library, you can also set a default voice and default voice engine to be used for any subsequent speech generation methods when a voice is not defined:

```javascript
import * as PlayHT from 'playht';

PlayHT.init({
  apiKey: '<YOUR API KEY>',
  userId: '<YOUR API KEY>',
  defaultVoiceId: 's3://peregrine-voices/oliver_narrative2_parrot_saad/manifest.json',
  defaultVoiceEngine: 'Play3.0-mini',
});
```

## Generating Speech

To get a URL with the audio for a generated file using the default settings, call the `generate()` method with the text you wish to convert.

```javascript
import * as PlayHT from 'playht';

// Generate audio from text
const generated = await PlayHT.generate('Computers can speak now!');

// Grab the generated file URL
const { audioUrl } = generated;

console.log('The url for the audio file is', audioUrl);
```

The output also contains a `generationId` field and an optional `message` field. `generationId` is a unique identifier for the generation request, which can be used for tracking and referencing the specific generation job. The optional `message` field gives additional information about the generation such as status or error messages.

For more speech generation options, see [Generating Speech Options](#generating-speech-options) below.

## Streaming Speech

The `stream()` method streams audio from a text. It returns a readable stream where the audio bytes will flow to as soon as they're ready. For example, to use the default settings to convert text into an audio stream and write it into a file:

```javascript
import * as PlayHT from 'playht';
import fs from 'fs';

// Create a file stream
const fileStream = fs.createWriteStream('hello-playht.mp3');

// Stream audio from text
const stream = await PlayHT.stream('This sounds very realistic.');

// Pipe stream into file
stream.pipe(fileStream);
```

The `stream()` method also allows you to stream audio from a text stream input. For example, to convert a text stream into an audio file using the default settings:

```javascript
import * as PlayHT from 'playht';
import { Readable } from 'stream';
import fs from 'fs';

// Create a test stream
const textStream = new Readable({
  read() {
    this.push('You can stream ');
    this.push('text right into ');
    this.push('an audio stream!');
    this.push(null); // End of data
  },
});

// Stream audio from text
const stream = await PlayHT.stream(textStream);

// Create a file stream
const fileStream = fs.createWriteStream('hello-playht.mp3');
stream.pipe(fileStream);
```

For a full example of using the streaming speech from input stream API, see our [ChatGPT Integration Example](packages/gpt-example/README.md).

For more speech generation options, see [Generating Speech Options](#generating-speech-options).

**_Note: For the lowest possible latency, use the streaming API with the `Play3.0-mini` model._**

## Generating Speech Options

All text-to-speech methods above accept an optional `options` parameter. You can use it to generate audio with different voices, AI models, output file formats and much more.

The options available will depend on the AI model that synthesizes the selected voice. PlayHT API supports different types of models: `Play3.0-mini`, `PlayHT2.0`, `PlayHT2.0-turbo`, `PlayHT1.0` and `Standard`. For all available options, see the TypeScript type definitions [in the code](packages/playht/src/index.ts).

### Play3.0-mini Voices (Recommended)

Our newest conversational voice AI model with added languages, lowest latency, and instant cloning. Compatible with `PlayHT2.0` and `PlayHT2.0-turbo`, our most reliable and fastest model for streaming.

To stream using the `Play3.0-mini` model:

```javascript
import * as PlayHT from 'playht';
import fs from 'fs';

// Create a file stream
const fileStream = fs.createWriteStream('play_3.mp3');

// Stream audio from text
const stream = await PlayHT.stream('Stream realistic voices that say what you want!', {
  voiceEngine: 'Play3.0-mini',
  voiceId: 's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json',
  outputFormat: 'mp3',
});

// Pipe stream into file
stream.pipe(fileStream);
```

### PlayHT 2.0 Voices

Our newest conversational voice AI model with added emotion direction and instant cloning. Compatible with `PlayHT2.0-turbo`. Supports english only.

To generate an audio file using a PlayHT 2.0 voice with emotion and other options:

```javascript
import * as PlayHT from 'playht';

const text = 'Am I a conversational voice with options?';

// Generate audio from text
const generated = await PlayHT.generate(text, {
  voiceEngine: 'PlayHT2.0',
  voiceId: 's3://peregrine-voices/oliver_narrative2_parrot_saad/manifest.json',
  outputFormat: 'mp3',
  temperature: 1.5,
  quality: 'high',
  speed: 0.8,
  emotion: 'male_fearful',
  styleGuidance: 20,
});

// Grab the generated file URL
const { audioUrl } = generated;

console.log('The url for the audio file is', audioUrl);
```

To stream using the `PlayHT2.0-turbo` model:

```javascript
import * as PlayHT from 'playht';
import fs from 'fs';

// Create a file stream
const fileStream = fs.createWriteStream('turbo-playht.mp3');

// Stream audio from text
const stream = await PlayHT.stream('Stream realistic voices that say what you want!', {
  voiceEngine: 'PlayHT2.0-turbo',
  voiceId: 's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json',
  outputFormat: 'mp3',
  emotion: 'female_happy',
  styleGuidance: 10,
});

// Pipe stream into file
stream.pipe(fileStream);
```

### PlayHT 1.0 Voices

Lifelike voices ideal for expressive and conversational content. Supports english only.

To generate audio with a PlayHT 1.0 voice:

```javascript
import * as PlayHT from 'playht';

const text = 'Options are never enough.';

// Generate audio from text
const generated = await PlayHT.generate(text, {
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

### Standard Voices

For multilingual text-to speech generations, changing pitches, and adding pauses. Voices with reliable outputs and support for Speech Synthesis Markup Language (SSML). Supports 100+ languages.

And an example with standard voice in Spanish:

```javascript
import * as PlayHT from 'playht';

const text = 'La inteligencia artificial puede hablar español.';

// Generate audio from text
const generated = await PlayHT.generate(text, {
  voiceEngine: 'Standard',
  voiceId: 'Mia',
  quality: 'low',
  speed: 1.2,
});

// Grab the generated file URL
const { audioUrl } = generated;

console.log('The url for the audio file is', audioUrl);
```

## Listing Available Voices

To list all available voices in our platform, including voices you cloned, you can call the `listVoices()` method with no parameters:

```javascript
import * as PlayHT from 'playht';

// Fetch all available voices
const voices = await PlayHT.listVoices();

// Output them to the console.
console.log(JSON.stringify(voices, null, 2));
```

The `listVoices()` method also takes in an optional parameter to filter the voices by different fields. To get all stock female PlayHT 2.0 voices:

```javascript
import * as PlayHT from 'playht';

// Fetch stock female PlayHT 2.0 voices
const voices = await PlayHT.listVoices({
  gender: 'female',
  voiceEngine: ['PlayHT2.0'],
  isCloned: false,
});

// Output them to the console.
console.log(JSON.stringify(voices, null, 2));
```

## Instant Clone a Voice

You can use the `clone()` method to create a cloned voice from audio data. The cloned voice is ready to be used straight away.

```javascript
import * as PlayHT from 'playht';
import fs from 'fs';

// Load an audio file
const fileBlob = fs.readFileSync('voice-to-clone.mp3');

// Clone the voice
const clonedVoice = await PlayHT.clone('dolly', fileBlob, 'male');

// Display the cloned voice information in the console
console.log('Cloned voice info\n', JSON.stringify(clonedVoice, null, 2));

// Use the cloned voice straight away to generate an audio file
const fileStream = fs.createWriteStream('hello-dolly.mp3');
const stream = await PlayHT.stream('Cloned voices sound realistic too.', {
  voiceEngine: clonedVoice.voiceEngine,
  voiceId: clonedVoice.id,
});
stream.pipe(fileStream);
```

The `clone()` method can also take in a URL string as input:

```javascript
import * as PlayHT from 'playht';
import fs from 'fs';

// Audio file url
const fileUrl = 'https://peregrine-samples.s3.amazonaws.com/peregrine-voice-cloning/Neil-DeGrasse-Tyson-sample.wav';

// Clone the voice
const clonedVoice = await PlayHT.clone('neil', fileUrl, 'male');

// Display the cloned voice information in the console
console.log('Cloned voice info\n', JSON.stringify(clonedVoice, null, 2));

// Use the cloned voice straight away to generate an audio file
const fileStream = fs.createWriteStream('hello-neil.mp3');
const stream = await PlayHT.stream('Cloned voices are pure science.', {
  voiceEngine: clonedVoice.voiceEngine,
  voiceId: clonedVoice.id,
});
stream.pipe(fileStream);
```

### Deleting a Cloned Voice

Use the `deleteClone()` method to delete cloned voices.

```javascript
import * as PlayHT from 'playht';

const cloneId = 's3://voice-cloning-zero-shot/abcdefgh-01d3-4613-asdf-9a8b7774dbc2/my-clone/manifest.json';

const message = await PlayHT.deleteClone(cloneId);

console.log('deleteClone result message is', message);
```

Keep in mind, this action cannot be undone.

# SDK Examples

This repository contains an implementation example for the API and an example of integrating with ChatGPT API.

To authenticate requests for the examples, you need to generate an API Secret Key and get your User ID. If you already have a PlayHT account, navigate to the [API access page](https://play.ht/studio/api-access). For more details [see the API documentation](https://docs.play.ht/reference/api-authentication#generating-your-api-secret-key-and-obtaining-your-user-id).

Before running the examples, build the SDK:

```shell
cd packages/playht
yarn install
yarn build
```

## Example Server

Create a new `.env` file in the `packages/sdk-example` folder by copying the `.env.example` file provided. Then edit the file with your credentials.

To run it locally:

```shell
cd packages/sdk-example
yarn
yarn install:all
yarn start
```

Navigate to http://localhost:3000/ to see the example server.

## ChatGPT Integration Example

Create a new `.env` file in the `packages/gpt-example/server` folder by copying the `.env.example` file provided. Then edit the file with your credentials.
This example requires your [OpenAI credentials](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key) too, the example `.env` file for details.

To run it locally:

```shell
cd packages/gpt-example
yarn
yarn install:all
yarn start
```

See the [full ChatGPT Integration Example documentation](packages/gpt-example/README.md).
