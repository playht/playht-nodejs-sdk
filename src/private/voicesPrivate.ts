import { VoiceInfo } from '..';
import PlayHTAPI from '..';
import availableV1Voices from '../api/availableV1Voices';
import availableV2Voices from '../api/availableV2Voices';
import availableClonedVoices from '../api/availableClonedVoices';

async function _getAllVoices(this: PlayHTAPI): Promise<Array<VoiceInfo>> {
  const [v1Voices, v2Voices, clonedVoices] = await Promise.all([
    availableV1Voices(this.apiKey, this.userId),
    availableV2Voices(this.apiKey, this.userId),
    availableClonedVoices(this.apiKey, this.userId),
  ]);

  if (this._allVoicesCache) {
    return this._allVoicesCache;
  }

  this._allVoicesCache = [
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

  return this._allVoicesCache;
}

export default { _getAllVoices };
