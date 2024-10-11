import dotenv from 'dotenv';

const testEnvFilePath = new URL('./.env', import.meta.url);

const result = dotenv.config({ path: testEnvFilePath });
if (result.error) {
  console.error(`Failed to load .env file for e2e tests.\n
Did you copy .env.e2e-test-example to .env and fill in the required values?\n
-----\n
${result.error}`);
  process.exit(1);
}

// eslint-disable-next-line no-process-env
if (!process.env.USER_ID || !process.env.API_KEY) {
  console.error(`USER_ID and API_KEY must be set in .env file for e2e tests.`);
  process.exit(1);
}

export const E2E_CONFIG = {
  // eslint-disable-next-line no-process-env
  USER_ID: process.env.USER_ID!,
  // eslint-disable-next-line no-process-env
  API_KEY: process.env.API_KEY!,
};
