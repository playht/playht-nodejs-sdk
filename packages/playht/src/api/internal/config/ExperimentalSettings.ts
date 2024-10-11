import { V3InternalSettings } from '../tts/v3/V3InternalSettings';

/**
 * experimental settings are hidden from the Public API because they are either incomplete or unstable,
 * and are subject to change without notice.
 */
export type ExperimentalSettings = {
  v3?: V3InternalSettings;
};
