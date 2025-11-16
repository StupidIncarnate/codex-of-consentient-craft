/**
 * PURPOSE: Applies user-defined architecture overrides to a framework preset configuration
 *
 * USAGE:
 * applyOverridesTransformer({preset, config});
 * // Returns modified preset with override packages added to each folder array
 */

import type { FrameworkPreset } from '../../contracts/framework-presets/framework-presets-contract';
import type { QuestmaestroConfig } from '../../contracts/questmaestro-config/questmaestro-config-contract';
import { isFrameworkPresetKeyGuard } from '../../guards/is-framework-preset-key/is-framework-preset-key-guard';

export const applyOverridesTransformer = ({
  preset,
  config,
}: {
  preset: FrameworkPreset;
  config: QuestmaestroConfig;
}): FrameworkPreset => {
  if (!config.architecture?.overrides) {
    return preset;
  }

  const result: FrameworkPreset = { ...preset };

  // Apply each override
  for (const [folder, override] of Object.entries(config.architecture.overrides)) {
    if (!override.add || !isFrameworkPresetKeyGuard({ key: folder })) {
      continue;
    }

    const folderKey = folder as keyof FrameworkPreset;
    const currentValues = result[folderKey];

    // Only add to folders that allow packages (not null)
    if (Array.isArray(currentValues)) {
      result[folderKey] = [...currentValues, ...override.add] as typeof currentValues;
    }
  }

  return result;
};
