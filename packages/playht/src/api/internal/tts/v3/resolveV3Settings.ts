import { APISettingsStore } from '../../../APISettingsStore';
import { deepMergeMaintainingDefaults } from '../../utils/deepMergeMaintainingDefaults';
import { V3_DEFAULT_SETTINGS } from './V3DefaultSettings';
import { V3InternalSettings } from './V3InternalSettings';

/**
 * Returns a configuration object with default settings merged with any provided overrides.
 *
 * @param overrides - The overrides to merge with the default settings.
 * @returns The merged configuration object.
 */
export function resolveV3Settings(overrides: V3InternalSettings | undefined | null) {
  return deepMergeMaintainingDefaults(
    V3_DEFAULT_SETTINGS,
    APISettingsStore.getSettings().experimental?.v3,
    overrides,
  ) ;
}
