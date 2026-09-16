/**
 * PURPOSE: Merges MockCall entries that target the same module under different specifier
 * strings. Jest resolves a bare Node builtin specifier ('process') and its `node:`-prefixed
 * form ('node:process') to the SAME module, so two proxies mocking it under different literal
 * specifiers must land on one merged record — otherwise the transformer emits two separate
 * jest.mock() factories for one module, Jest keeps only one, and the losing proxy's mocked
 * identifier silently falls through to the real implementation. The dedup key strips the
 * `node:` prefix; the merged record keeps whichever specifier arrived first, which Jest
 * resolves correctly either way. When both an auto-mock (no factory, no identifierNames) and a
 * factory-mock exist for the same module, the factory-mock wins. Multiple identifier-only
 * mocks for the same module union their identifierNames.
 *
 * USAGE:
 * mockCallsMergeByModuleTransformer({ mockCalls: [processCwdMock, processKillMock] });
 * // Returns one MockCall per module, identifierNames unioned across every specifier form
 */

import { mockCallContract } from '../../contracts/mock-call/mock-call-contract';
import { moduleNameContract } from '../../contracts/module-name/module-name-contract';
import type { MockCall } from '../../contracts/mock-call/mock-call-contract';
import type { ModuleName } from '../../contracts/module-name/module-name-contract';

export const mockCallsMergeByModuleTransformer = ({
  mockCalls,
}: {
  mockCalls: MockCall[];
}): MockCall[] => {
  const mocksByModuleKey = new Map<ModuleName, MockCall>();

  for (const mock of mockCalls) {
    const moduleKey = moduleNameContract.parse(mock.moduleName.replace(/^node:/u, ''));
    const existing = mocksByModuleKey.get(moduleKey);

    if (!existing) {
      mocksByModuleKey.set(moduleKey, mock);
    } else if (mock.factory && !existing.factory) {
      mocksByModuleKey.set(moduleKey, mock);
    } else if (!mock.factory && !existing.factory && mock.identifierNames.length > 0) {
      const mergedIdentifiers = [...existing.identifierNames];
      for (const name of mock.identifierNames) {
        if (!mergedIdentifiers.includes(name)) {
          mergedIdentifiers.push(name);
        }
      }
      mocksByModuleKey.set(
        moduleKey,
        mockCallContract.parse({ ...existing, identifierNames: mergedIdentifiers }),
      );
    }
  }

  return [...mocksByModuleKey.values()];
};
