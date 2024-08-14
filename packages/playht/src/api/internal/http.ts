import https from 'https';

export const keepAliveHttpsAgent = new https.Agent({
  keepAlive: true,
});
