/**
 * PURPOSE: Validates and defines framework type for project configuration
 *
 * USAGE:
 * import {frameworkContract} from './framework-contract';
 * const framework = frameworkContract.parse('react');
 * // Returns validated Framework type
 */

import { z } from 'zod';
import { frameworkStatics } from '../../statics/framework/framework-statics';

export const frameworkContract = z.enum(frameworkStatics.frameworks.all);
export type Framework = z.infer<typeof frameworkContract>;
