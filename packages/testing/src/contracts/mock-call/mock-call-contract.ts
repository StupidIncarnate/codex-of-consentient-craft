/**
 * PURPOSE: Validates mock call information extracted from proxy files
 *
 * USAGE:
 * mockCallContract.parse({
 *   moduleName: 'axios',
 *   factory: '() => ({ get: jest.fn() })',
 *   sourceFile: '/path/to/proxy.ts'
 * });
 * // Returns validated MockCall object
 */

import { z } from 'zod';
import { moduleNameContract } from '../module-name/module-name-contract';
import { factoryFunctionTextContract } from '../factory-function-text/factory-function-text-contract';
import { sourceFileNameContract } from '../source-file-name/source-file-name-contract';
import { identifierNameContract } from '../identifier-name/identifier-name-contract';

export const mockCallContract = z.object({
  moduleName: moduleNameContract,
  factory: factoryFunctionTextContract.nullable(),
  sourceFile: sourceFileNameContract,
  identifierNames: z.array(identifierNameContract).default([]),
});

export type MockCall = z.infer<typeof mockCallContract>;
