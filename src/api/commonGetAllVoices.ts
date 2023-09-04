import type { VoiceInfo } from '..';
import { availableClonedVoices } from './availableClonedVoices';
import { availableV1Voices } from './availableV1Voices';
import { availableV2Voices } from './availableV2Voices';

export async function commonGetAllVoices(/* filters?: VoicesFilter */): Promise<Array<VoiceInfo>> {
  const [v1Voices, v2Voices, clonedVoices] = await Promise.all([
    availableV1Voices(),
    availableV2Voices(),
    availableClonedVoices(),
  ]);
  return [...v1Voices, ...v2Voices, ...clonedVoices];
}
