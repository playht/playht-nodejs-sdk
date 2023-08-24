import express from 'express';
import ttsV2 from './ttsV2';
import ttsV1 from './ttsV1';
import voicesV1 from './voicesV1';
import voicesV2 from './voicesV2';
import clonedVoices from './clonedVoices';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());

app.post('/ttsV2', ttsV2);
app.post('/ttsV1', ttsV1);
app.get('/voicesV1', voicesV1);
app.get('/voicesV2', voicesV2);
app.get('/clonedVoices', clonedVoices);
app.use('/', express.static('public'));

app.listen(3000, () => {
  console.log('PlayHT-API-Example app is listening on port 3000.');
});
