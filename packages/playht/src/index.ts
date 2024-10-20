import { APISettingsStore } from './api/APISettingsStore';
import { commonGenerateSpeech, commonGenerateStream } from './api/apiCommon';
import { commonGetAllVoices } from './api/commonGetAllVoices';
import { commonInstantClone, internalDeleteClone } from './api/instantCloneInternal';
import { PlayRequestConfig } from './api/internal/config/PlayRequestConfig';
import { warmUpAuthBasedEngine } from './api/internal/tts/v3/warmUpAuthBasedEngine';

/**
 * The various voice engines that can be used for speech synthesis.
 *
 * For the lowest latency, use `Play3.0-mini`.
 */
export type VoiceEngine = 'Play3.0-mini' | 'PlayHT2.0-turbo' | 'PlayHT2.0' | 'PlayHT1.0' | 'Standard';

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
 * The various formats that the PlayHT 1.0 model output audio stream can have.
 */
export type PlayHT10OutputStreamFormat = 'mp3' | 'mulaw';

/**
 * The various formats that the PlayHT 2.0 model output audio stream can have.
 */
export type PlayHT20OutputStreamFormat = 'raw' | 'mp3' | 'wav' | 'ogg' | 'flac' | 'mulaw';

/**
 * The various languages that the Play3.0-mini model output audio stream support.
 */
export type Play30StreamLanguage =
  | 'afrikaans'
  | 'albanian'
  | 'amharic'
  | 'arabic'
  | 'bengali'
  | 'bulgarian'
  | 'catalan'
  | 'croatian'
  | 'czech'
  | 'danish'
  | 'dutch'
  | 'english'
  | 'french'
  | 'galician'
  | 'german'
  | 'greek'
  | 'hebrew'
  | 'hindi'
  | 'hungarian'
  | 'indonesian'
  | 'italian'
  | 'japanese'
  | 'korean'
  | 'malay'
  | 'mandarin'
  | 'polish'
  | 'portuguese'
  | 'russian'
  | 'serbian'
  | 'spanish'
  | 'swedish'
  | 'tagalog'
  | 'thai'
  | 'turkish'
  | 'ukrainian'
  | 'urdu'
  | 'xhosa';

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
 * Potential values for emotions to be applied to speech.
 * @typedef {(
 *   'female_happy' |
 *   'female_sad' |
 *   'female_angry' |
 *   'female_fearful' |
 *   'female_disgust' |
 *   'female_surprised' |
 *   'male_happy' |
 *   'male_sad' |
 *   'male_angry' |
 *   'male_fearful' |
 *   'male_disgust' |
 *   'male_surprised'
 * )} Emotion
 */
export type Emotion =
  | 'female_happy'
  | 'female_sad'
  | 'female_angry'
  | 'female_fearful'
  | 'female_disgust'
  | 'female_surprised'
  | 'male_happy'
  | 'male_sad'
  | 'male_angry'
  | 'male_fearful'
  | 'male_disgust'
  | 'male_surprised';

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
 * The options available for configuring the PlayHT 1.0 voice engine for streaming.
 *
 * @typedef {Object} PlayHT10EngineOptions
 *
 * @property {'PlayHT1.0'} voiceEngine - The identifier for the PlayHT 1.0 voice engine.
 * @property {'plain'} [inputType] - The optional input type for the audio. Only 'plain' is supported for PlayHT 1.0
 * voices.
 * @property {OutputFormat} [outputFormat] - The optional format in which the output audio stream should be generated.
 * Defaults to 'mp3'.
 * @property {number} [sampleRate] - The optional sample rate for the output audio.
 * @property {number} [seed] - An integer number greater than or equal to 0. If equal to null or not provided, a random
 * seed will be used. Useful to control the reproducibility of the generated audio. Assuming all other properties
 * didn't change, a fixed seed will generate the exact same audio file.
 * @property {number} [temperature] - A floating point number between 0, inclusive, and 2, inclusive. The temperature
 * parameter controls variance. Lower temperatures result in more predictable results. Higher temperatures allow each
 * run to vary more, creating voices that sound less like the baseline.
 */
export type PlayHT10EngineStreamOptions = Omit<PlayHT10EngineOptions, 'outputFormat'> & {
  outputFormat?: PlayHT10OutputStreamFormat;
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
 * @property {Emotion} [emotion] - An emotion to be applied to the speech. When using a stock voice or a cloned voice
 * where gender was provided, genderless emotions can be used. For cloned voices with no gender set, use a gender
 * prefixed emotion. Only supported when `voice_engine` is set to `PlayHT2.0`, and `voice` uses that engine.
 * @property {number} [voiceGuidance] - A number between 1 and 6. Use lower numbers to reduce how unique your chosen
 * voice will be compared to other voices. Higher numbers will maximize its individuality. Only supported when
 * `voice_engine` is set to `PlayHT2.0`, and `voice` uses that engine.
 * @property {number} [styleGuidance] - A number between 1 and 30. Use lower numbers to to reduce how strong your
 * chosen emotion will be. Higher numbers will create a very emotional performance. Only supported when `voice_engine`
 * is set to `PlayHT2.0`, and `voice` uses that engine.
 * @property {number} [textGuidance] - A number between 1 and 2. This number influences how closely the generated
 * speech adheres to the input text. Use lower values to create more fluid speech, but with a higher chance of
 * deviating from the input text. Higher numbers will make the generated speech more accurate to the input text,
 * ensuring that the words spoken align closely with the provided text. Only supported when `voice_engine` is set
 * to `PlayHT2.0`, and `voice` uses that engine.
 */
export type PlayHT20EngineOptions = {
  voiceEngine: 'PlayHT2.0';
  inputType?: 'plain';
  outputFormat?: OutputFormat;
  sampleRate?: number;
  seed?: number;
  temperature?: number;
  emotion?: Emotion;
  voiceGuidance?: number;
  styleGuidance?: number;
  textGuidance?: number;
};

/**
 * The options available for configuring the PlayHT 2.0 voice engine for streaming.
 *
 * @typedef {Object} PlayHT20EngineOptions
 *
 * @property {'PlayHT2.0'} voiceEngine - The identifier for the PlayHT 2.0 voice engine.
 * @property {'plain'} [inputType] - The optional input type for the audio. Only 'plain' is supported for PlayHT 1.0
 * voices.
 * @property {OutputFormat} [outputFormat] - The optional format in which the output audio stream should be generated.
 * Defaults to 'mp3'.
 * @property {number} [sampleRate] - The optional sample rate for the output audio.
 * @property {number} [seed] - An integer number greater than or equal to 0. If equal to null or not provided, a random
 * seed will be used. Useful to control the reproducibility of the generated audio. Assuming all other properties
 * didn't change, a fixed seed will generate the exact same audio file.
 * @property {number} [temperature] - A floating point number between 0, inclusive, and 2, inclusive. The temperature
 * parameter controls variance. Lower temperatures result in more predictable results. Higher temperatures allow each
 * run to vary more, creating voices that sound less like the baseline.
 * @property {Emotion} [emotion] - An emotion to be applied to the speech. When using a stock voice or a cloned voice
 * where gender was provided, genderless emotions can be used. For cloned voices with no gender set, use a gender
 * prefixed emotion. Only supported when `voice_engine` is set to `PlayHT2.0`, and `voice` uses that engine.
 * @property {number} [voiceGuidance] - A number between 1 and 6. Use lower numbers to reduce how unique your chosen
 * voice will be compared to other voices. Higher numbers will maximize its individuality. Only supported when
 * `voice_engine` is set to `PlayHT2.0`, and `voice` uses that engine.
 * @property {number} [styleGuidance] - A number between 1 and 30. Use lower numbers to to reduce how strong your
 * chosen emotion will be. Higher numbers will create a very emotional performance. Only supported when `voice_engine`
 * is set to `PlayHT2.0`, and `voice` uses that engine.
 * @property {number} [textGuidance] - A number between 1 and 2. This number influences how closely the generated
 * speech adheres to the input text. Use lower values to create more fluid speech, but with a higher chance of
 * deviating from the input text. Higher numbers will make the generated speech more accurate to the input text,
 * ensuring that the words spoken align closely with the provided text. Only supported when `voice_engine` is set
 * to `PlayHT2.0`, and `voice` uses that engine.
 */
export type PlayHT20EngineStreamOptions = Omit<PlayHT20EngineOptions, 'outputFormat' | 'voiceEngine'> & {
  voiceEngine: 'PlayHT2.0' | 'PlayHT2.0-turbo';
  outputFormat?: PlayHT20OutputStreamFormat;
};

/**
 * The options available for configuring the Play3.0-mini voice engine for streaming.
 *
 * @typedef {Object} PlayHT20EngineOptions
 *
 * @property {'plain'} [inputType] - The optional input type for the audio. Only 'plain' is supported for PlayHT 1.0
 * voices.
 * @property {OutputFormat} [outputFormat] - The optional format in which the output audio stream should be generated.
 * Defaults to 'mp3'.
 * @property {number} [sampleRate] - The optional sample rate for the output audio.
 * @property {number} [seed] - An integer number greater than or equal to 0. If equal to null or not provided, a random
 * seed will be used. Useful to control the reproducibility of the generated audio. Assuming all other properties
 * didn't change, a fixed seed will generate the exact same audio file.
 * @property {number} [temperature] - A floating point number between 0, inclusive, and 2, inclusive. The temperature
 * parameter controls variance. Lower temperatures result in more predictable results. Higher temperatures allow each
 * run to vary more, creating voices that sound less like the baseline.
 * @property {number} [voiceGuidance] - A number between 1 and 6. Use lower numbers to reduce how unique your chosen
 * voice will be compared to other voices. Higher numbers will maximize its individuality. Only supported when
 * `voice_engine` is set to `PlayHT2.0`, and `voice` uses that engine.
 * @property {number} [styleGuidance] - A number between 1 and 30. Use lower numbers to to reduce how strong your
 * chosen emotion will be. Higher numbers will create a very emotional performance. Only supported when `voice_engine`
 * is set to `PlayHT2.0`, and `voice` uses that engine.
 * @property {number} [textGuidance] - A number between 1 and 2. This number influences how closely the generated
 * speech adheres to the input text. Use lower values to create more fluid speech, but with a higher chance of
 * deviating from the input text. Higher numbers will make the generated speech more accurate to the input text,
 * ensuring that the words spoken align closely with the provided text. Only supported when `voice_engine` is set
 * to `PlayHT2.0`, and `voice` uses that engine.
 */
export type Play30EngineStreamOptions = Omit<PlayHT20EngineStreamOptions, 'voiceEngine' | 'emotion'> & {
  /**
   * The identifier for the Play3.0-mini voice engine.
   */
  voiceEngine: 'Play3.0-mini';
  /**
   * The language spoken by the voice.
   */
  language?: Play30StreamLanguage;
};

/**
 * The options available for configuring speech synthesis, which include shared options combined with engine-specific
 * options.
 */
export type SpeechOptions = SharedSpeechOptions &
  (PlayHT20EngineOptions | PlayHT10EngineOptions | StandardEngineOptions);

/**
 * The options available for configuring speech stream, which include shared options combined with engine-specific
 * options.
 */
export type SpeechStreamOptions = SharedSpeechOptions &
  (Play30EngineStreamOptions | PlayHT20EngineStreamOptions | PlayHT10EngineStreamOptions | StandardEngineOptions);

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
 * a voice engine is not defined. If provided, the engine will be warmed up right away, which can reduce latency of
 * the first call.
 * @property {string} [customAddr] - An optional custom address (host:port) to send requests to.
 * @property {string} [fallbackEnabled] - If true, the client may choose to, under high load scenarios, fallback
 * from a custom address (configured with "customAddr" above) to the standard PlayHT address.
 */
export type APISettingsInput = {
  apiKey: string;
  userId: string;
  defaultVoiceId?: string;
  defaultVoiceEngine?: VoiceEngine;
  removeSsmlTags?: boolean;

  /**
   * An optional custom address (host:port) to send requests to.
   *
   * If you're using PlayHT On-Prem (https://docs.play.ht/reference/on-prem), then you should set
   * customAddr to be the address of your PlayHT On-Prem appliance (e.g. my-company-000001.on-prem.play.ht:11045).
   *
   * Keep in mind that your PlayHT On-Prem appliance can only be used with the PlayHT2.0-Turbo voice engine for streaming.
   */
  customAddr?: string;

  /**
   * If true, the client may choose to, under high load scenarios, fallback from a custom address
   * (configured with "customAddr" above) to the standard PlayHT address.
   */
  fallbackEnabled?: boolean;
};

/**
 * Initializes the library with API credentials.
 *
 * @param {APISettingsInput} settings - The settings for API configuration.
 */
export function init(settings: APISettingsInput) {
  APISettingsStore.setSettings(settings);
  if (settings.defaultVoiceEngine === 'Play3.0-mini') {
    warmUpAuthBasedEngine(settings);
  }
}

/**
 * Generates speech from the given input text and options.
 *
 * @async
 * @param {string} input - The input text to generate speech from.
 * @param {SpeechOptions} [options] - Optional parameters to customize speech generation.
 * @returns {Promise<SpeechOutput>} - A promise that resolves to the speech output.
 */
export async function generate(input: string, options?: SpeechOptions): Promise<SpeechOutput> {
  return await commonGenerateSpeech(input, options);
}

/**
 * Streams generated speech to the provided writable stream.
 *
 * @async
 * @param {string | NodeJS.ReadableStream} input - Either the text string or a text stream to be used to generate speech.
 * @param {SpeechStreamOptions} [options] - Optional parameters to customize speech stream generation.
 * @returns {Promise<NodeJS.ReadableStream>} - A promise that resolves to a ReadableStream object that streams audio data.
 */
export async function stream(
  input: string | NodeJS.ReadableStream,
  options?: SpeechStreamOptions,
): Promise<NodeJS.ReadableStream> {
  // The per-call SDK Settings is "hidden" from the Public API because this feature is still alpha, meaning
  // not everything supports on-the-fly settings right now.
  // eslint-disable-next-line prefer-rest-params
  const perRequestConfig = arguments[2] ?? ({} as PlayRequestConfig);
  return await commonGenerateStream(input, options, perRequestConfig);
}

/**
 * Creates a new voice by cloning from audio file data.
 *
 * @async
 * @param {string} voiceName - The name for the new voice.
 * @param {string | Buffer} input - Either the audio file or an url to an audio file to use as the source for the new
 * voice.
 * @param {VoiceGender} [voiceGender] - The gender for the new voice. The AI model needs this information to
 * support certain features.
 * @param {string} [mimeType] - Optional MIME type for the source audio file. If not provided, the MIME type will be
 * determined from the file data or url extension.
 * @returns {Promise<VoiceInfo>} - A promise that resolves to a voice information object for the generated voice.
 */
export async function clone(
  voiceName: string,
  input: string | Buffer,
  voiceGender?: VoiceGender,
  mimeType?: string,
): Promise<VoiceInfo> {
  return await commonInstantClone(voiceName, input, voiceGender, mimeType);
}

/**
 * Deletes a cloned voice.
 *
 * @async
 * @param {string} voiceId - The id of the voice to delete.
 * @returns {Promise<string>} - A promise that resolves to a string indicating the status of the deletion.
 */
export async function deleteClone(voiceId: string): Promise<string> {
  return await internalDeleteClone(voiceId);
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

export { PlayRequestConfig };
