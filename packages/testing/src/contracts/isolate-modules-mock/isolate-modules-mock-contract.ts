/**
 * PURPOSE: Defines one module replacement `isolateModules` applies through doMock before it loads the
 * entry point — the module's path and the factory whose return value stands in for its exports.
 *
 * USAGE:
 * const mock: IsolateModulesMock = { module: filePathContract.parse('/abs/module'), factory: () => ({}) };
 * // One entry of isolateModules({ mocks, entrypoint })
 */

import { z } from '#gateway/npm/zod';


// `factory` is a function — zod validates only `module`; `.loose()` carries `factory` through
// `.parse()` unvalidated, since a Zod object schema cannot check callability.
export const isolateModulesMockContract = z.object({ module: z.string().brand<'IsolateModulesMockModule'>() }).loose().brand<'IsolateModulesMock'>();

export type IsolateModulesMock = z.infer<typeof isolateModulesMockContract> & {
  factory: () => Record<PropertyKey, unknown>;
};
