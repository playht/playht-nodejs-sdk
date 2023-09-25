import axios from 'axios';
import { CONFIG } from '../config';

export interface VoiceData {
  id: string;
  voiceEngine: string;
  isCloned: boolean;
  name: string;
}

export const uploadAndCloneVoice = async (file: File, voiceName: string): Promise<VoiceData> => {
  const formData = new FormData();
  formData.append('audioFile', file);
  formData.append('voiceName', voiceName);

  const response = await axios.post(CONFIG.BACKEND_HOST_URL + '/uploadInstantClone', formData);
  return response.data;
};
