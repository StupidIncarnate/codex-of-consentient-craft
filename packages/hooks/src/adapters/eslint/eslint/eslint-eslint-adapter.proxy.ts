/**
 * PURPOSE: Proxy for eslint-eslint-adapter that mocks ESLint instance creation
 *
 * USAGE:
 * const proxy = eslintEslintAdapterProxy();
 * proxy.getLintTextHandle().calledWith(['const x = 1;']).resolves([...]);
 */
import { ESLint } from 'eslint';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

// Auto-mock the eslint module via the AST transformer
registerModuleMock({ module: 'eslint' });

// Module-level so every eslintEslintAdapterProxy() call in the same test — e.g. a broker proxy
// that composes several eslint broker proxies together — shares the same fake instance and
// method mocks. If these were rebuilt per call, only the LAST proxy's staging would ever be
// reachable, since the constructor mock can only hand back one instance.
const lintTextFn = jest.fn();
const lintFilesFn = jest.fn();
const isPathIgnoredFn = jest.fn();

// Create mock instance that passes instanceof checks
const mockEslintInstance = Object.create(ESLint.prototype) as ESLint;
mockEslintInstance.lintText = lintTextFn as ESLint['lintText'];
mockEslintInstance.lintFiles = lintFilesFn as ESLint['lintFiles'];
mockEslintInstance.isPathIgnored = isPathIgnoredFn as ESLint['isPathIgnored'];

export const eslintEslintAdapterProxy = (): {
  getConstructorHandle: () => MockHandle;
  getLintTextHandle: () => MockHandle;
  getLintFilesHandle: () => MockHandle;
  getIsPathIgnoredHandle: () => MockHandle;
  getSharedInstance: () => ESLint;
} => {
  const constructorHandle: MockHandle = registerMock({ fn: ESLint as never });
  const lintTextHandle: MockHandle = registerMock({ fn: lintTextFn });
  const lintFilesHandle: MockHandle = registerMock({ fn: lintFilesFn });
  const isPathIgnoredHandle: MockHandle = registerMock({ fn: isPathIgnoredFn });

  // The constructor's own argument (options) carries no information any consumer of THIS
  // default needs — every call gets the same fake instance, and the instance's methods
  // (addressed by their own real arguments below) are where per-call behaviour actually lives.
  // eslint-load-config-broker.proxy.ts is the one consumer that dispatches by the constructor's
  // cwd argument; it stages `calledWith` matchers on this same handle that score higher than
  // this empty-array catch-all, so its staging wins regardless of registration order.
  constructorHandle.calledWith([]).implement(() => mockEslintInstance);

  // lintText/lintFiles/isPathIgnored are ad-hoc methods on the fake instance above, not real
  // npm exports, so there is no "real" implementation to fall back to. Every consumer that
  // cares about a specific file/content stages a more specific `calledWith` on the handle it
  // gets back (see the eslint broker proxies), which wins over these empty-array catch-alls.
  lintTextHandle.calledWith([]).resolves([]);
  lintFilesHandle.calledWith([]).resolves([]);
  isPathIgnoredHandle.calledWith([]).resolves(false);

  return {
    getConstructorHandle: () => constructorHandle,
    getLintTextHandle: () => lintTextHandle,
    getLintFilesHandle: () => lintFilesHandle,
    getIsPathIgnoredHandle: () => isPathIgnoredHandle,
    // Exposed so a sibling proxy that must dispatch construction by an argument (cwd) — see
    // eslint-load-config-broker.proxy.ts — can still hand back an instance with working
    // lintText/lintFiles/isPathIgnored. Composed tests can construct ESLint through more than one
    // broker with the SAME cwd (e.g. violations-check-new-broker.proxy.ts composes
    // eslintIsPathIgnoredBrokerProxy and eslintLoadConfigBrokerProxy, both of which build
    // options as a bare {cwd}), so a cwd-keyed override can answer for a construction call that
    // was never load-config's own. Basing that override on this shared instance means it stays
    // functional either way instead of crashing on a missing method.
    getSharedInstance: () => mockEslintInstance,
  };
};
