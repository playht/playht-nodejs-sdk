import type { PlayDialogTurboEngineStreamOptions } from '../../../../index';
import type { SpeechOptionsWithVoiceID } from '../../../apiCommon';
import { isPlayDialogTurboVoice } from './PlayDialogTurboVoice';

const PLAYDIALOG_TURBO_SUPPORTED_OUTPUT_FORMATS = ['wav', 'mp3'];

export function isPlayDialogTurboSupportedCall(
  options: SpeechOptionsWithVoiceID,
  defaultPlayDialogToPlayDialogTurbo?: boolean,
): options is PlayDialogTurboEngineStreamOptions {
  if (options.voiceEngine === 'PlayDialog-turbo') return true;
  if (!defaultPlayDialogToPlayDialogTurbo) return false;
  if (options.voiceEngine !== 'PlayDialog') return false;

  const isSupportedLanguage = !options.language || options.language === 'english' || options.language === 'arabic';
  if (!isSupportedLanguage) return false;

  if (!isPlayDialogTurboVoice(options.voiceId, (options.language ?? 'english') as 'english' | 'arabic')) return false;

  // Is turbo call if none of the unsupported parameters are provided
  // ignored: seed, quality
  return (
    (!options.sampleRate || options.sampleRate === 48_000) &&
    !options.temperature &&
    !options.voiceId2 &&
    !options.turnPrefix &&
    !options.turnPrefix2 &&
    !options.voiceConditioningSeconds &&
    !options.voiceConditioningSeconds2 &&
    (!options.speed || options.speed === 1) &&
    (!options.outputFormat || PLAYDIALOG_TURBO_SUPPORTED_OUTPUT_FORMATS.includes(options.outputFormat))
  );
}
