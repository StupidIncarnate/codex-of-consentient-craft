/**
 * PURPOSE: Subpath barrel for @dungeonmaster/testing/register-mock
 * Isolated from main barrel to avoid pulling in MSW/ESM dependencies
 *
 * USAGE:
 * import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
 */

export { mockRegisterMiddleware as registerMock } from './middleware/mock-register/mock-register-middleware';
export type { MockHandle } from './contracts/mock-handle/mock-handle-contract';
export type { MockStaging } from './contracts/mock-staging/mock-staging-contract';
export type { RecordedCalls } from './contracts/recorded-calls/recorded-calls-contract';
export { spyOnRegisterMiddleware as registerSpyOn } from './middleware/spy-on-register/spy-on-register-middleware';
export type { SpyOnHandle } from './middleware/spy-on-register/spy-on-register-middleware';
export { moduleMockRegisterMiddleware as registerModuleMock } from './middleware/module-mock-register/module-mock-register-middleware';
export { actualModuleRequireMiddleware as requireActual } from './middleware/actual-module-require/actual-module-require-middleware';
export { modulesIsolateMiddleware as isolateModules } from './middleware/modules-isolate/modules-isolate-middleware';
export type { IsolateModulesMock } from './contracts/isolate-modules-mock/isolate-modules-mock-contract';
