# SDK Example

This folder contains an express.js server implementation example for the PlayHT SDK.

To authenticate requests, you need to generate an API Secret Key and obtain your User ID. If you already have a PlayHT account, navigate to the [API access page](https://play.ht/studio/api-access). For more details [see the API documentation](https://docs.play.ht/reference/api-authentication#generating-your-api-secret-key-and-obtaining-your-user-id).

Before running the examples, build the SDK:

```shell
cd ../playht
yarn install
yarn build
```

## Example Server

Create a new `.env` file in the `packages/sdk-example` folder by copying the `.env.example` file provided. Then edit the file with your credentials.

To run it locally:

```shell
yarn
yarn install:all
yarn start
```

Navigate to http://localhost:3000/ to see the example server.
