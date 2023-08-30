import { SpeechOptions, SpeechOutput } from '..';
import APISettingsStore from './APISettingsStore';
import generateV1Speech from './generateV1Speech';
import generateV2Speech, { V2ApiOptions } from './generateV2Speech';
import { V1ApiOptions, qualityToPreset } from './v1Common';

export default async function commonGenerateSpeech(input: string, options: SpeechOptions): Promise<SpeechOutput> {
  const engine = options.voiceEngine;
  const voiceId = options.voiceId || APISettingsStore.getSettings().defaultVoiceId;

  if (engine === 'PlayHT1.0') {
    const v2Options: V2ApiOptions = {
      quality: options.quality,
      outputFormat: options.outputFormat,
      speed: options.speed,
      sampleRate: options.sampleRate,
      seed: options.seed,
      temperature: options.temperature,
    };

    const result = await generateV2Speech(input, voiceId, v2Options);
    return {
      audioUrl: result.url,
      generationId: result.id,
    };
  } else if (engine === 'Standard') {
    const v1Options: V1ApiOptions = {
      narrationStyle: options.narrationStyle,
      pronunciations: options.pronunciations,
      trimSilence: options.trimSilence,
      preset: qualityToPreset(options.quality),
      globalSpeed: Math.trunc((options.speed || 1) * 100) + '%',
    };

    const result = await generateV1Speech(input, voiceId, v1Options);
  }
  throw new Error('Invalid engine.');
}
