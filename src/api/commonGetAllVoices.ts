import type { VoiceInfo, VoicesFilter } from '..';
import { availableClonedVoices } from './availableClonedVoices';
import { availableV1Voices } from './availableV1Voices';
import { availableV2Voices } from './availableV2Voices';

export async function commonGetAllVoices(filters?: VoicesFilter): Promise<Array<VoiceInfo>> {
  const needV1Voices =
    filters?.isCloned !== true && (!filters || !filters.voiceEngine || filters.voiceEngine.includes('Standard'));
  const needV2Voices =
    filters?.isCloned !== true &&
    (!filters ||
      !filters.voiceEngine ||
      filters.voiceEngine.includes('PlayHT1.0') ||
      filters.voiceEngine.includes('PlayHT2.0'));
  const needClonedVoices = !filters || filters.isCloned === undefined || filters.isCloned;

  const [v1Voices, v2Voices, clonedVoices] = await Promise.all([
    needV1Voices ? availableV1Voices() : [],
    needV2Voices ? availableV2Voices() : [],
    needClonedVoices ? availableClonedVoices() : [],
  ]);
  return [...v1Voices, ...v2Voices, ...clonedVoices].filter((voice) => {
    if (filters?.id && filters.id !== voice.id) {
      return false;
    }
    if (filters?.name && filters.name !== voice.name) {
      return false;
    }
    if (filters?.voiceEngine && !filters.voiceEngine.includes(voice.voiceEngine)) {
      return false;
    }
    if (filters?.ageGroup && (!voice.ageGroup || !filters.ageGroup.includes(voice.ageGroup))) {
      return false;
    }
    if (filters?.gender && filters.gender !== voice.gender) {
      return false;
    }
    if (filters?.language && (!voice.language || !filters.language.includes(voice.language))) {
      return false;
    }
    if (filters?.languageCode && (!voice.languageCode || !filters.languageCode.includes(voice.languageCode))) {
      return false;
    }
    if (filters?.isCloned !== undefined && voice.isCloned !== filters.isCloned) {
      return false;
    }

    return true;
  });
}
