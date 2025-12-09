/**
 * PURPOSE: Applies user-defined architecture overrides to a framework preset configuration
 *
 * USAGE:
 * applyOverridesTransformer({preset, config});
 * // Returns modified preset with override packages added to each folder array
 */

import type { FrameworkPreset } from '../../contracts/framework-presets/framework-presets-contract';
import type { DungeonmasterConfig } from '../../contracts/dungeonmaster-config/dungeonmaster-config-contract';
import { isFrameworkPresetKeyGuard } from '../../guards/is-framework-preset-key/is-framework-preset-key-guard';

export const applyOverridesTransformer = ({
  preset,
  config,
}: {
  preset: FrameworkPreset;
  config: DungeonmasterConfig;
}): FrameworkPreset => {
  if (!config.architecture?.overrides) {
    return preset;
  }

  const result: FrameworkPreset = { ...preset };

  // Apply each override
  for (const [folder, override] of Object.entries(config.architecture.overrides)) {
    if (!override?.add || !isFrameworkPresetKeyGuard({ key: folder })) {
      continue;
    }

    // Get current value using Reflect to avoid type assertion
    const currentValues: unknown = Reflect.get(result, folder);

    // Only add to folders that allow packages (not null)
    if (!Array.isArray(currentValues)) {
      continue;
    }

    // Verify all elements are strings before spreading
    const allStrings = currentValues.every((item) => typeof item === 'string');
    if (!allStrings) {
      continue;
    }

    Reflect.set(result, folder, [...currentValues, ...override.add]);
  }

  return result;
};
