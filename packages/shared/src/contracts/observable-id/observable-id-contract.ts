/**
 * PURPOSE: Defines the branded UUID type for Observable identifiers
 *
 * USAGE:
 * observableIdContract.parse('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
 * // Returns: ObservableId branded string
 */

import { z } from 'zod';

export const observableIdContract = z.string().uuid().brand<'ObservableId'>();

export type ObservableId = z.infer<typeof observableIdContract>;
