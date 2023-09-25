import axios from 'axios';
import { CONFIG } from '../config';

export const getAll = async () => axios.get(`${CONFIG.BACKEND_HOST_URL}/listVoices/`, {}).then((result) => result.data);
