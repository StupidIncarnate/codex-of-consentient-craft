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

import { z } from '#gateway/npm/zod';
import { moduleNameContract } from '../module-name/module-name-contract';
import { factoryFunctionTextContract } from '../factory-function-text/factory-function-text-contract';
import { sourceFileNameContract } from '../source-file-name/source-file-name-contract';

export const mockCallContract = z.object({
  moduleName: moduleNameContract,
  factory: factoryFunctionTextContract.nullable(),
  sourceFile: sourceFileNameContract,
  identifierNames: z.array(z.string().min(1).brand<'MockCallIdentifierNames'>()).default([]),
  // A property-access `registerMock({fn: X.method})` records X here, never in identifierNames — the
  // codegen for these auto-mocks every one of X's OWN methods (an object export, mockable the same
  // way Jest's own whole-module automock already mocks a nested object recursively), instead of
  // replacing X's single accessed method with a flat `X: jest.fn()`, which would destroy X's other
  // methods entirely.
  objectIdentifierNames: z.array(z.string().min(1).brand<'MockCallObjectIdentifierNames'>()).default([]),
});

export type MockCall = z.infer<typeof mockCallContract>;
