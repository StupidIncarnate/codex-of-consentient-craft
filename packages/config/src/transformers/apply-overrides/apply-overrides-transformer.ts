import type { FrameworkPreset } from '../../contracts/framework-presets/framework-presets';
import type { QuestmaestroConfig } from '../../contracts/questmaestro-config/questmaestro-config-contract';

const FRAMEWORK_PRESET_KEYS: readonly string[] = [
  'widgets',
  'bindings',
  'state',
  'flows',
  'responders',
  'contracts',
  'brokers',
  'transformers',
  'errors',
  'middleware',
  'adapters',
  'startup',
] as const;

const isFrameworkPresetKey = (key: string): key is keyof FrameworkPreset =>
  FRAMEWORK_PRESET_KEYS.includes(key);

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
    if (override.add && isFrameworkPresetKey(folder)) {
      const currentValues = result[folder];

      // Only add to folders that allow packages (not null)
      if (Array.isArray(currentValues)) {
        result[folder] = [...currentValues, ...override.add];
      }
    }
  }

  return result;
};
