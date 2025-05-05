import { deepmergeCustom } from 'deepmerge-ts';

const customizedDeepmerge = deepmergeCustom({
  mergeOthers: (values, utils) => {
    const nonNullish = values.filter((v) => v !== undefined && v !== null);
    if (nonNullish.length > 0) {
      // at least one value, good to go
      return utils.defaultMergeFunctions.mergeOthers(nonNullish);
    }
    // no non-nullish values, return null if there's one, otherwise undefined
    return utils.defaultMergeFunctions.mergeOthers(values.filter((v) => v !== undefined));
  },
});

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Merges two objects deeply, maintaining the defaults from the first object.
 * If the second object has fields that are undefined or null, the first object's values will be kept.
 *
 * @param defaults - The default object to merge with.
 * @param overwrites - The object to merge with the defaults.
 * @returns The merged object.
 */
export function deepMergeMaintainingDefaults<T>(defaults: T, ...overwrites: Array<DeepPartial<T> | undefined | null>): T {
  return customizedDeepmerge(defaults, ...overwrites) as T;
}
