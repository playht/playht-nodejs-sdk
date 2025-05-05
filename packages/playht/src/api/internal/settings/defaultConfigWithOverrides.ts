import { APISettingsStore } from '../../APISettingsStore';
import { PlayRequestConfig, PlayRequestConfigWithDefaults } from '../config/PlayRequestConfig';
import { deepMergeMaintainingDefaults } from '../utils/deepMergeMaintainingDefaults';

/**
 * Returns a configuration object with default settings merged with any provided overrides.
 *
 * @param overrides - The overrides to merge with the default settings.
 * @returns The merged configuration object.
 */
export function defaultConfigWithOverrides(
  overrides: PlayRequestConfig | undefined | null,
): PlayRequestConfigWithDefaults {
  return deepMergeMaintainingDefaults<PlayRequestConfigWithDefaults>({ settings: APISettingsStore.getSettings() }, overrides);
}
