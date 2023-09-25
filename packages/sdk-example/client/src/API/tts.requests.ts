import { CONFIG } from '../config';
import axios from 'axios';
import { Voice } from '../hooks/useVoices';

export const generateSpeech = async (text: string, voice: Voice) => {
  const response = await axios.post(CONFIG.BACKEND_HOST_URL + '/textToSpeech', {
    text,
    voiceId: voice.id,
    voiceEngine: voice.voiceEngine,
  });

  return response.data;
};
