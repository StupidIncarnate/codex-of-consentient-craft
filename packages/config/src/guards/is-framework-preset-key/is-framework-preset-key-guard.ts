/**
 * PURPOSE: Validates if a string is a valid framework preset property key
 *
 * USAGE:
 * isFrameworkPresetKeyGuard('widgets');
 * // Returns true and narrows the value to keyof FrameworkPreset, false otherwise
 */

import type { FrameworkPreset } from '../../contracts/framework-presets/framework-presets-contract';
import { frameworkPresetsContract } from '../../contracts/framework-presets/framework-presets-contract';

export const isFrameworkPresetKeyGuard = (key: unknown): key is keyof FrameworkPreset =>
  typeof key === 'string' && Object.hasOwn(frameworkPresetsContract.shape, key);
