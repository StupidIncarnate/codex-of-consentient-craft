import type { FrameworkPreset } from '../../contracts/framework-presets/framework-presets';
import type { QuestmaestroConfig } from '../../contracts/questmaestro-config/questmaestro-config-contract';

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

  const result = { ...preset };

  // Apply each override
  for (const [folder, override] of Object.entries(config.architecture.overrides)) {
    if (override.add) {
      const folderKey = folder as keyof FrameworkPreset;
      const currentValues = result[folderKey];

      // Only add to folders that allow packages (not null)
      if (Array.isArray(currentValues)) {
        (result[folderKey] as string[]) = [...currentValues, ...override.add];
      }
    }
  }

  return result;
};
