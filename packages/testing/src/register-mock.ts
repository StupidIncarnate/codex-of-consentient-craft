/**
 * PURPOSE: Subpath barrel for @dungeonmaster/testing/register-mock
 * Isolated from main barrel to avoid pulling in MSW/ESM dependencies
 *
 * USAGE:
 * import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
 */

export { jestRegisterMockAdapter as registerMock } from './adapters/jest/register-mock/jest-register-mock-adapter';
export type { MockHandle } from './adapters/jest/register-mock/jest-register-mock-adapter';
export { jestRegisterSpyOnAdapter as registerSpyOn } from './adapters/jest/register-spy-on/jest-register-spy-on-adapter';
export type { SpyOnHandle } from './adapters/jest/register-spy-on/jest-register-spy-on-adapter';
export { jestRegisterModuleMockAdapter as registerModuleMock } from './adapters/jest/register-module-mock/jest-register-module-mock-adapter';
export { jestRequireActualAdapter as requireActual } from './adapters/jest/require-actual/jest-require-actual-adapter';
