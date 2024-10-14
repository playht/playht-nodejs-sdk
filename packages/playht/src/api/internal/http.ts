import https from 'node:https';

export const keepAliveHttpsAgent = new https.Agent({
  keepAlive: true,
});
