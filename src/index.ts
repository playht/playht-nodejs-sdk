import { Writable } from 'node:stream';
import { APISettingsStore } from './api/APISettingsStore';
import { commonGenerateSpeech, commonGenerateStream } from './api/apiCommon';
import { commonGetAllVoices } from './api/commonGetAllVoices';
import { instantCloneFromBufferInternal } from './api/instantCloneInternal';

/**
 * Type representing the various voice engines that can be used for speech synthesis.
 *
 * @typedef {'PlayHT2.0' | 'PlayHT1.0' | 'Standard'} VoiceEngine
 */
export type VoiceEngine = 'PlayHT2.0' | 'PlayHT1.0' | 'Standard';

/**
 * Type representing the different input types that can be used to define the format of the input text.
 *
 * @typedef {'ssml' | 'plain'} InputType
 */
export type InputType = 'ssml' | 'plain';

/**
 * Type representing the different quality levels that can be chosen for the output speech.
 *
 * @typedef {'draft' | 'low' | 'medium' | 'high' | 'premium'} OutputQuality
 */
export type OutputQuality = 'draft' | 'low' | 'medium' | 'high' | 'premium';

/**
 * Type representing the various formats that the output audio can have.
 *
 * @typedef {'mp3' | 'ogg' | 'wav' | 'flac' | 'mulaw'} OutputFormat
 */
export type OutputFormat = 'mp3' | 'ogg' | 'wav' | 'flac' | 'mulaw';

/**
 * Type representing the different gender options available for voice selection.
 *
 * @typedef {'male' | 'female'} VoiceGender
 */
export type VoiceGender = 'male' | 'female';

/**
 * Type representing the different age groups that can be specified for voice selection.
 *
 * @typedef {'youth' | 'adult' | 'senior'} VoiceAgeGroup
 */
export type VoiceAgeGroup = 'youth' | 'adult' | 'senior';

/**
 * Type representing detailed information about a voice.
 *
 * @typedef {Object} VoiceInfo
 *
 * @property {string} id - The unique identifier for the voice.
 * @property {string} name - The name of the voice.
 * @property {VoiceEngine} voiceEngine - The engine that generates the voice.
 * @property {string} [sampleUrl] - An optional URL for an audio file with a voice sample.
 * @property {string} [language] - The language spoken by the voice.
 * @property {string} [languageCode] - The ISO code for the language spoken by the voice.
 * @property {VoiceGender} [gender] - An optional gender classification of the voice.
 * @property {string} [accent] - An optional accent of the voice.
 * @property {VoiceAgeGroup} [ageGroup] - An optional age group classification of the voice.
 * @property {Array<string>} [styles] - An optional list of styles that the voice can produce.
 * @property {boolean} isCloned - Indicates whether the voice is cloned.
 */
export type VoiceInfo = {
  id: string;
  name: string;
  voiceEngine: VoiceEngine;
  sampleUrl?: string;
  language?: string;
  languageCode?: string;
  gender?: VoiceGender;
  accent?: string;
  ageGroup?: VoiceAgeGroup;
  styles?: Array<string>;
  isCloned: boolean;
};

/**
 * Type representing the criteria for filtering voices.
 *
 * @typedef {Object} VoicesFilter
 *
 * @property {string} [id] - An optional identifier to filter voices by their unique identifier.
 * @property {string} [name] - An optional name to filter voices by their name.
 * @property {Array<VoiceEngine>} [voiceEngine] - An optional array of voice engines to filter voices by the AI
 * engine that generates them.
 * @property {Array<string>} [language] - An optional array of languages to filter voices by the language they speak.
 * @property {Array<string>} [languageCode] - An optional array of language ISO codes to filter voices by their
 * language codes.
 * @property {VoiceGender} [gender] - An optional gender to filter voices by their gender classification.
 * @property {Array<VoiceAgeGroup>} [ageGroup] - An optional array of age groups to filter voices by their age group
 * classification.
 * @property {boolean} [isCloned] - An optional flag to filter voices based on whether they are cloned.
 */
export type VoicesFilter = {
  id?: string;
  name?: string;
  voiceEngine?: Array<VoiceEngine>;
  language?: Array<string>;
  languageCode?: Array<string>;
  gender?: VoiceGender;
  ageGroup?: Array<VoiceAgeGroup>;
  isCloned?: boolean;
};

/**
 * Common options that can be shared across different voice engine configurations.
 *
 * @typedef {Object} SharedSpeechOptions
 *
 * @property {VoiceEngine} voiceEngine - Specifies the voice engine to be used for speech synthesis.
 * @property {string} [voiceId] - Identifier for the voice to be used to synthesize the text. Refer to the
 * `listVoices()` method for a list of supported voices.
 * @property {InputType} [inputType] - Optional type defining the format of the input text.
 * @property {number} [speed] - Control how fast the generated audio should be. A number greater than 0 and less than
 * or equal to 5.0.
 * @property {OutputQuality} [quality] - Optional parameter to define the output quality of the speech.
 */
export type SharedSpeechOptions = {
  voiceEngine: VoiceEngine;
  voiceId?: string;
  inputType?: InputType;
  speed?: number;
  quality?: OutputQuality;
};

/**
 * The options available for configuring the standard voice engine.
 *
 * @typedef {Object} StandardEngineOptions
 *
 * @property {'Standard'} voiceEngine - The identifier for the standard voice engine.
 * @property {string} [narrationStyle] - An optional parameter to define the tone and accent of the voice. The values
 * for `narrationStyle` supported by the voice in your request are retured when calling the `listVoices` method.
 * @property {Array<{ key: string; value: string }>} [pronunciations] - An optional array of objects containing
 * key-value pairs defining specific pronunciations for particular words.
 * @property {boolean} [trimSilence] - When enabled, the audio will be trimmed to remove any silence from the end of
 * the file.
 */
export type StandardEngineOptions = {
  voiceEngine: 'Standard';
  narrationStyle?: string;
  pronunciations?: Array<{ key: string; value: string }>;
  trimSilence?: boolean;
};

/**
 * The options available for configuring the PlayHT 1.0 voice engine.
 *
 * @typedef {Object} PlayHT10EngineOptions
 *
 * @property {'PlayHT1.0'} voiceEngine - The identifier for the PlayHT 1.0 voice engine.
 * @property {'plain'} [inputType] - The optional input type for the audio. Only 'plain' is supported for PlayHT 1.0
 * voices.
 * @property {OutputFormat} [outputFormat] - The optional format in which the output audio should be generated.
 * Defaults to 'mp3'.
 * @property {number} [sampleRate] - The optional sample rate for the output audio.
 * @property {number} [seed] - An integer number greater than or equal to 0. If equal to null or not provided, a random
 * seed will be used. Useful to control the reproducibility of the generated audio. Assuming all other properties
 * didn't change, a fixed seed will generate the exact same audio file.
 * @property {number} [temperature] - A floating point number between 0, inclusive, and 2, inclusive. The temperature
 * parameter controls variance. Lower temperatures result in more predictable results. Higher temperatures allow each
 * run to vary more, creating voices that sound less like the baseline.
 */
export type PlayHT10EngineOptions = {
  voiceEngine: 'PlayHT1.0';
  inputType?: 'plain';
  outputFormat?: OutputFormat;
  sampleRate?: number;
  seed?: number;
  temperature?: number;
};

/**
 * The options available for configuring the PlayHT 2.0 voice engine.
 *
 * @typedef {Object} PlayHT20EngineOptions
 *
 * @property {'PlayHT2.0'} voiceEngine - The identifier for the PlayHT 2.0 voice engine.
 * @property {'plain'} [inputType] - The optional input type for the audio. Only 'plain' is supported for PlayHT 1.0
 * voices.
 * @property {OutputFormat} [outputFormat] - The optional format in which the output audio should be generated.
 * Defaults to 'mp3'.
 * @property {number} [sampleRate] - The optional sample rate for the output audio.
 * @property {number} [seed] - An integer number greater than or equal to 0. If equal to null or not provided, a random
 * seed will be used. Useful to control the reproducibility of the generated audio. Assuming all other properties
 * didn't change, a fixed seed will generate the exact same audio file.
 * @property {number} [temperature] - A floating point number between 0, inclusive, and 2, inclusive. The temperature
 * parameter controls variance. Lower temperatures result in more predictable results. Higher temperatures allow each
 * run to vary more, creating voices that sound less like the baseline.
 */
export type PlayHT20EngineOptions = {
  voiceEngine: 'PlayHT2.0';
  inputType?: 'plain';
  outputFormat?: OutputFormat;
  sampleRate?: number;
  seed?: number;
  temperature?: number;
};

/**
 * The options available for configuring speech synthesis, which include shared options combined with engine-specific
 * options.
 *
 * @typedef {Object} SpeechOptions
 *
 * @property {SharedSpeechOptions & PlayHT20EngineOptions} - Combination of shared speech options and PlayHT 2.0
 * engine-specific options.
 * @property {SharedSpeechOptions & PlayHT10EngineOptions} - Combination of shared speech options and PlayHT 1.0
 * engine-specific options.
 * @property {SharedSpeechOptions & StandardEngineOptions} - Combination of shared speech options and standard
 * engine-specific options.
 */
export type SpeechOptions =
  | (SharedSpeechOptions & PlayHT20EngineOptions)
  | (SharedSpeechOptions & PlayHT10EngineOptions)
  | (SharedSpeechOptions & StandardEngineOptions);

/**
 * `SpeechOutput` is the output type for a text-to-speech method, providing information about the generated
 * speech output file.
 *
 * @typedef {Object} SpeechOutput
 *
 * @property {string} audioUrl - The URL where the generated speech audio can be accessed.
 * @property {string} generationId - A unique identifier for the generation request, which can be used for tracking and
 * referencing the specific generation call.
 * @property {string} [message] - An optional message giving additional information about the generation request, such
 * as status messages, error information, etc.
 */
export type SpeechOutput = {
  audioUrl: string;
  generationId: string;
  message?: string;
};

/**
 * Type representing the input settings for API configuration.
 *
 * @typedef {Object} APISettingsInput
 *
 * @property {string} apiKey - The API key used for authentication.
 * @property {string} userId - The user identifier for authentication.
 * @property {string} [defaultVoiceId] - An optional default voice ID to be used in speech synthesis when a voice is
 * not defined.
 * @property {VoiceEngine} [defaultVoiceEngine] - An optional default voice engine to be used in speech synthesis when
 * a voice engine is not defined.
 */
export type APISettingsInput = {
  apiKey: string;
  userId: string;
  defaultVoiceId?: string;
  defaultVoiceEngine?: VoiceEngine;
};

/**
 * Initializes the library with API credentials.
 *
 * @param {APISettingsInput} settings - The settings for API configuration.
 */
export function init(settings: APISettingsInput) {
  APISettingsStore.setSettings(settings);
}

/**
 * Generates speech from the given input text and options.
 *
 * @async
 * @param {string} input - The input text to generate speech from.
 * @param {SpeechOptions} [options] - Optional parameters to customize speech generation.
 * @returns {Promise<SpeechOutput>} - A promise that resolves to the speech output.
 */
export async function generateSpeech(input: string, options?: SpeechOptions): Promise<SpeechOutput> {
  return await commonGenerateSpeech(input, options);
}

/**
 * Streams generated speech to the provided writable stream.
 *
 * @async
 * @param {string} input - The input text to generate speech from.
 * @param {Writable} outputStream - The stream where the speech will be piped to.
 * @param {SpeechOptions} [options] - Optional parameters to customize speech generation.
 * @returns {Promise<void>} - A promise that resolves when the speech starts to be written to the stream.
 */
export async function streamSpeech(input: string, outputStream: Writable, options?: SpeechOptions): Promise<void> {
  return await commonGenerateStream(input, outputStream, options);
}

/**
 * Lists all voices that match the given filters.
 *
 * @async
 * @param {VoicesFilter} [filters] - Optional filters to apply when listing voices.
 * @returns {Promise<Array<VoiceInfo>>} - A promise that resolves to an array of voice information objects.
 */
export async function listVoices(filters?: VoicesFilter): Promise<Array<VoiceInfo>> {
  return await commonGetAllVoices(filters);
}

/**
 * Creates a new voice by cloning from audio file data.
 *
 * @async
 * @param {string} voiceName - The name for the new voice.
 * @param {Buffer} fileBlob - The audio file to use as the source for the new voice.
 * @param {VoiceGender} [voiceGender] - The gender for the new voice. The AI model needs this information to
 * support certain features.
 * @param {string} [mimeType] - Optional MIME type for the source audio file.
 * @returns {Promise<VoiceInfo>} - A promise that resolves to a voice information object for the generated voice.
 */
export async function instantCloneFromBuffer(
  voiceName: string,
  fileBlob: Buffer,
  voiceGender?: VoiceGender,
  mimeType?: string,
): Promise<VoiceInfo> {
  return await instantCloneFromBufferInternal(voiceName, fileBlob, voiceGender, mimeType);
}
