/**
 * PURPOSE: Subpath barrel for @dungeonmaster/testing/register-mock
 * Isolated from main barrel to avoid pulling in MSW/ESM dependencies
 *
 * USAGE:
 * import { registerMock } from '@dungeonmaster/testing/register-mock';
 */

export { jestRegisterMockAdapter as registerMock } from './adapters/jest/register-mock/jest-register-mock-adapter';
export type { MockHandle } from './adapters/jest/register-mock/jest-register-mock-adapter';
