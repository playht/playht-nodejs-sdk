import type { PlayDialogTurboEngineStreamOptions } from '../../../../index';
import type { SpeechOptionsWithVoiceID } from '../../../apiCommon';
import { isPlayDialogTurboVoice } from './PlayDialogTurboVoice';

export function isPlayDialogTurboSupportedCall(
  options: SpeechOptionsWithVoiceID,
): options is PlayDialogTurboEngineStreamOptions {
  if (options.voiceEngine === 'PlayDialog-turbo') return true;
  if (options.voiceEngine !== 'PlayDialog') return false;

  const isSupportedLanguage = !options.language || options.language === 'english' || options.language === 'arabic';
  // ignored: seed, quality
  const isNotUsingUnsupportedParam =
    !options.sampleRate &&
    !options.temperature &&
    !options.voiceId2 &&
    !options.turnPrefix &&
    !options.turnPrefix2 &&
    !options.voiceConditioningSeconds &&
    !options.voiceConditioningSeconds2 &&
    (!options.speed || options.speed === 1) &&
    (!options.outputFormat || options.outputFormat === 'wav');

  return isSupportedLanguage && isNotUsingUnsupportedParam && isPlayDialogTurboVoice(options.voiceId);
}
