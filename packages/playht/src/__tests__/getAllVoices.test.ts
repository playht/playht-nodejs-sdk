import { describe, expect, jest } from '@jest/globals';

const standardVoice = { id: 's1', name: 'S1', voiceEngine: 'Standard', isCloned: false };
const play2Voice = { id: 'v2', name: 'V2', voiceEngine: 'PlayHT2.0', isCloned: false };
const play1Voice = { id: 'v1', name: 'V1', voiceEngine: 'PlayHT1.0', isCloned: false };
const clonedVoice = { id: 'c1', name: 'C1', voiceEngine: 'PlayHT2.0', isCloned: true };

const availableV1Voices = jest.fn().mockReturnValue([standardVoice]);
const availableV2Voices = jest.fn().mockReturnValue([play2Voice, play1Voice]);
const availableClonedVoices = jest.fn().mockReturnValue([clonedVoice]);

jest.unstable_mockModule('../api/availableV1Voices', () => ({
  availableV1Voices: availableV1Voices,
}));
jest.unstable_mockModule('../api/availableV2Voices', () => ({
  availableV2Voices: availableV2Voices,
}));
jest.unstable_mockModule('../api/availableClonedVoices', () => ({
  availableClonedVoices: availableClonedVoices,
}));

const { commonGetAllVoices } = await import('../api/commonGetAllVoices');

describe('commonGetAllVoices', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return all voices when no filters are provided', async () => {
    const voices = await commonGetAllVoices();
    expect(voices).toEqual([clonedVoice, play2Voice, play1Voice, standardVoice]);
    expect(availableV1Voices).toHaveBeenCalled();
    expect(availableV2Voices).toHaveBeenCalled();
    expect(availableClonedVoices).toHaveBeenCalled();
  });

  it('should return voices that match standard voices filters', async () => {
    const voices = await commonGetAllVoices({ voiceEngine: ['Standard'] });
    expect(voices).toEqual([standardVoice]);
    expect(availableV1Voices).toHaveBeenCalled();
    expect(availableV2Voices).toHaveBeenCalledTimes(0);
    expect(availableClonedVoices).toHaveBeenCalled();
  });

  it('should return an empty array when no voices match the id', async () => {
    const voices = await commonGetAllVoices({ id: 'v3' });
    expect(voices).toEqual([]);
  });

  it('should return an empty array when no voices match', async () => {
    const voices = await commonGetAllVoices({ id: 'v1', voiceEngine: ['PlayHT2.0'] });
    expect(voices).toEqual([]);
  });

  it('should return voices that match the isCloned filter', async () => {
    const voices = await commonGetAllVoices({ isCloned: true });
    expect(voices).toEqual([clonedVoice]);
    expect(availableV1Voices).toHaveBeenCalledTimes(0);
    expect(availableV2Voices).toHaveBeenCalledTimes(0);
    expect(availableClonedVoices).toHaveBeenCalled();
  });

  it('should return an empty array when no voices match the isCloned filter', async () => {
    const voices = await commonGetAllVoices({ isCloned: false });
    expect(voices).toEqual([play2Voice, play1Voice, standardVoice]);
    expect(availableV1Voices).toHaveBeenCalled();
    expect(availableV2Voices).toHaveBeenCalled();
    expect(availableClonedVoices).toHaveBeenCalledTimes(0);
  });
});
