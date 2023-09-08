# PlayHT API Library (TypeScript/Node.js)

## Installation

The `playht` package is distributed as a module on [npm](https://www.npmjs.com/package/playht).

```shell
yarn add playht
# or
npm install --save playht
```

## Usage

```ts
import { Client } from 'playht'

const client = new Client({
    userId: '<YOUR_USER_ID>',
    apiKey: '<YOUR_API_KEY>',
})

const stream = await client.tts({
    text: 'Hello World!',
    voice: 'larry',
})

// stream is a ReadableStream, see https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
for await (const chunk of stream) {
    // do something with the audio chunk
}

// or pipe it to a file
import {createWriteStream} from 'node:fs'
import {Writable} from 'node:stream'

const file = createWriteStream('hello-world.mp3')
await stream.pipeTo(Writable.toWeb(file))
```

## Developing

You need [Make](https://www.gnu.org/software/make/), [node.js](https://nodejs.org/en/) and [yarn](https://classic.yarnpkg.com/en/docs/install) installed.

Clone the repository and run `make` to checkout all dependencies and build the project. See the [Makefile](./Makefile) for other useful targets. Before submitting a pull request make sure to run `make format`.
