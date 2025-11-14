/**
 * PURPOSE: Validates if a value is a valid framework type
 *
 * USAGE:
 * isValidFrameworkGuard({framework: 'react'});
 * // Returns true if framework is valid, false otherwise
 */

import { isInReadonlyArrayGuard } from '../is-in-readonly-array/is-in-readonly-array-guard';
import { frameworkStatics } from '../../statics/framework/framework-statics';

export const isValidFrameworkGuard = ({ framework }: { framework?: unknown }): boolean =>
  isInReadonlyArrayGuard({ value: framework, array: frameworkStatics.frameworks.all });
