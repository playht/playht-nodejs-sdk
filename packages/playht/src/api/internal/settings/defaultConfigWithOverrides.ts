import deepmerge from 'deepmerge';
import { isPlainObject } from 'is-plain-object';
import { APISettingsStore } from '../../APISettingsStore';
import { PlayRequestConfig, PlayRequestConfigWithDefaults } from '../config/PlayRequestConfig';

/**
 * Returns a configuration object with default settings merged with any provided overrides.
 *
 * @param overrides - The overrides to merge with the default settings.
 * @returns The merged configuration object.
 */
export function defaultConfigWithOverrides(overrides: PlayRequestConfig | undefined | null): PlayRequestConfigWithDefaults {
  return deepmerge({ settings: APISettingsStore.getSettings() }, overrides ?? {}, {
    isMergeableObject: isPlainObject,
  })
}
