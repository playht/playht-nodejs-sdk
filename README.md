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

```
npm install @playht/playht-nodejs-sdk
```

or for installation with [yarn](https://yarnpkg.com/) package manager:

```
yarn add @playht/playht-nodejs-sdk
```

## Usage

Import the `PlayHT` class and create an instance with your credentials:

```javascript
import PlayHTAPI from '@playht/playht-nodejs-sdk';

// ...When you need to access the API
const apiKey = '<YOUR API KEY>';
const userId = '<YOUR USER ID>';

const api = new PlayHTAPI(apiKey, userId);
```

**Important:** Keep your API Secret Key confidential. Do not share it with anyone or include it in publicly accessible code repositories.

### Listing all Ultra-Realistic voices

TODO

### Listing all available Cloned voices

TODO

### Listing all Standard or Premium voices

TODO

### Generating speech from an Ultra-Realistic voice

TODO

### Streaming speech from an Ultra-Realistic voice

TODO

### Generating speech from a Standard or Premium voice

TODO

## Example server

This repository contains an [Express](https://expressjs.com/) server implementation example for the API.

To run it locally:

```console
> yarn
> yarn build
> cd example
> yarn
> yarn start
```
