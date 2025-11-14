/**
 * PURPOSE: Validates and defines routing library type for project configuration
 *
 * USAGE:
 * import {routingLibraryContract} from './routing-library-contract';
 * const library = routingLibraryContract.parse('react-router-dom');
 * // Returns validated RoutingLibrary type
 */

import { z } from 'zod';
import { routingLibraryStatics } from '../../statics/routing-library/routing-library-statics';

export const routingLibraryContract = z.enum(routingLibraryStatics.libraries.all);
export type RoutingLibrary = z.infer<typeof routingLibraryContract>;
