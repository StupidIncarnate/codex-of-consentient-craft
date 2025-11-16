/**
 * PURPOSE: Validates if a string is a valid framework preset property key
 *
 * USAGE:
 * isFrameworkPresetKeyGuard({key: 'widgets'});
 * // Returns true if key is a valid preset property, false otherwise
 */

import { frameworkPresetKeysStatics } from '../../statics/framework-preset-keys/framework-preset-keys-statics';
import { isInReadonlyArrayGuard } from '../is-in-readonly-array/is-in-readonly-array-guard';

export const isFrameworkPresetKeyGuard = ({ key }: { key?: unknown }): boolean =>
  isInReadonlyArrayGuard({
    value: key,
    array: frameworkPresetKeysStatics.keys.all,
  });
