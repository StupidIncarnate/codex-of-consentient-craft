/**
 * PURPOSE: Validates factory function text from jest.mock() calls
 *
 * USAGE:
 * factoryFunctionTextContract.parse('() => ({ get: jest.fn() })');
 * // Returns validated FactoryFunctionText branded type
 */

import { z } from 'zod';

export const factoryFunctionTextContract = z.string().brand<'FactoryFunctionText'>();

export type FactoryFunctionText = z.infer<typeof factoryFunctionTextContract>;
