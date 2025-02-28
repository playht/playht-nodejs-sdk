/**
 * Gets a setting value from multiple source objects, returning the first non-nullish value found.
 * The last source is treated as the default and must contain the setting.
 *
 * @param settingName The name of the setting to retrieve
 * @param sources Multiple objects to search for the setting, in order of precedence
 * @returns The first non-nullish value found, or the value from the default source
 */
export function getSetting<K extends keyof DefaultSource, DefaultSource extends Record<string, any>>(
  settingName: K,
  ...sources: [...Array<Record<string, any> | undefined | null>, DefaultSource]
): DefaultSource[K] {
  for (const source of sources) {
    if (source === null || source === undefined) continue;

    // Use "in" operator to check if the property exists before accessing it
    if (settingName in source) {
      const value = source[settingName as keyof typeof source];
      if (value !== undefined && value !== null) {
        return value as DefaultSource[K];
      }
    }
  }

  // If no value was found in earlier sources, use the default value from the last source
  const defaultSource = sources[sources.length - 1] as DefaultSource;
  return defaultSource[settingName];
}
