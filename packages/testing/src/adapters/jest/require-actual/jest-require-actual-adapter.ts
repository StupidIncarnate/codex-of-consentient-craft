/**
 * PURPOSE: Wraps jest.requireActual so proxy files can access real module exports without calling jest APIs directly
 *
 * USAGE:
 * const realPath = jestRequireActualAdapter({ module: 'path' }) as { resolve: typeof resolve };
 * realPath.resolve('/a', 'b'); // Calls real path.resolve, not the mock
 *
 * WHEN-TO-USE: When a parent proxy needs the real implementation of a module mocked by a child proxy
 * WHEN-NOT-TO-USE: When registerMock's dispatcher passthrough is sufficient
 */

export const jestRequireActualAdapter = ({ module: moduleName }: { module: string }): unknown =>
  jest.requireActual(moduleName);
