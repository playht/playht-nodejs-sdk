import { VoiceInfo, APISettings } from '..';
import availableV1Voices from './availableV1Voices';
import availableV2Voices from './availableV2Voices';
import availableClonedVoices from './availableClonedVoices';

let _allVoicesCache: Array<VoiceInfo>;

export default async function getAllVoices(settings: APISettings): Promise<Array<VoiceInfo>> {
  const [v1Voices, v2Voices, clonedVoices] = await Promise.all([
    availableV1Voices(settings),
    availableV2Voices(settings),
    availableClonedVoices(settings),
  ]);

  if (_allVoicesCache) {
    return _allVoicesCache;
  }

  _allVoicesCache = [
    ...v1Voices.map((v1) => ({
      engineType: 'Standard' as const,
      ...v1,
    })),
    ...v2Voices.map((v2) => ({
      engineType: v2.engine === 'parrot' ? ('PlayHT2.0' as const) : ('PlayHT1.0' as const),
      ...v2,
    })),
    ...clonedVoices.map((c) => ({
      engineType: c.type === 'instant' ? ('PlayHT2.0' as const) : ('PlayHT1.0' as const),
      ...c,
    })),
  ];

  return _allVoicesCache;
}
