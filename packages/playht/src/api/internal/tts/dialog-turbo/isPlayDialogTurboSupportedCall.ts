import type { PlayDialogTurboEngineStreamOptions } from '../../../../index';
import type { SpeechOptionsWithVoiceID } from '../../../apiCommon';
import { isPlayDialogTurboVoice } from './PlayDialogTurboVoice';

export function isPlayDialogTurboSupportedCall(
  options: SpeechOptionsWithVoiceID,
  defaultPlayDialogToPlayDialogTurbo?: boolean,
): options is PlayDialogTurboEngineStreamOptions {
  if (options.voiceEngine === 'PlayDialog-turbo') return true;
  if (!defaultPlayDialogToPlayDialogTurbo) return false;
  if (options.voiceEngine !== 'PlayDialog') return false;

  if (!isPlayDialogTurboVoice(options.voiceId)) return false;

  const isSupportedLanguage = !options.language || options.language === 'english' || options.language === 'arabic';
  if (!isSupportedLanguage) return false;

  // Is turbo call if none of the unsupported parameters are provided
  // ignored: seed, quality
  return (
    !options.sampleRate &&
    !options.temperature &&
    !options.voiceId2 &&
    !options.turnPrefix &&
    !options.turnPrefix2 &&
    !options.voiceConditioningSeconds &&
    !options.voiceConditioningSeconds2 &&
    (!options.speed || options.speed === 1) &&
    (!options.outputFormat || options.outputFormat === 'wav')
  );
}
