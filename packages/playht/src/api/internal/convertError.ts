import { Readable } from 'node:stream';

export const convertError = async (error: any) => {
  const body = await bodyAsString(error);
  return Promise.reject({
    message: body?.error_message || error.message,
    code: error.code,
    statusCode: error.response?.status ?? error.response?.statusCode,
    statusMessage: error.response?.statusText ?? error.response?.statusMessage,
    body: body,
  });
};

async function bodyAsString(error: any) {
  if (!error.response?.data) {
    return null;
  }
  if (error.response?.data instanceof Readable) {
    return readWholeStreamIntoString(error.response.data);
  }
  return error.response?.data;
}

function readWholeStreamIntoString(stream: Readable) {
  return new Promise((resolve, reject) => {
    let data = '';
    stream.on('data', (chunk) => (data += chunk));
    stream.on('end', () => resolve(data));
    stream.on('error', (e) => reject(e));
  });
}
