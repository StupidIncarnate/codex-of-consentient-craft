/**
 * PURPOSE: Merges MockCall entries that target the same module under different specifier
 * strings. Jest resolves a bare Node builtin specifier ('process') and its `node:`-prefixed
 * form ('node:process') to the SAME module, so two proxies mocking it under different literal
 * specifiers must land on one merged record — otherwise the transformer emits two separate
 * jest.mock() factories for one module, Jest keeps only one, and the losing proxy's mocked
 * identifier silently falls through to the real implementation. The dedup key strips the
 * `node:` prefix; the merged record keeps whichever specifier arrived first, which Jest
 * resolves correctly either way.
 *
 * Three kinds of request land on the same module: a FACTORY mock (an explicit second argument),
 * a FULL-AUTO mock (no factory, empty identifierNames — a property-access `registerMock`, e.g.
 * `StartOrchestrator.getQuest`, or a bare `registerModuleMock({module})` with no factory), and a
 * SELECTIVE mock (no factory, non-empty identifierNames — a bare-export `registerMock`, e.g.
 * `questListBroker`). Precedence is FACTORY > FULL-AUTO > SELECTIVE, decided pairwise so the
 * result is the same regardless of arrival order:
 * - An existing factory always wins; a later factory never displaces the first one to arrive.
 * - Absent a factory on either side, a FULL-AUTO request (either side has empty identifierNames)
 *   wins and the merged record's identifierNames is forced to []. Jest's automock already
 *   replaces every export with a jest.fn() (objects mocked recursively — that's what makes a
 *   property-accessed `StartOrchestrator.method` mockable at all), so a bare `jest.mock(module)`
 *   already covers whatever a SELECTIVE request named; nothing from that request is lost.
 * - Two SELECTIVE requests union their identifierNames, so each proxy's own named export ends up
 *   in the one spread-real factory.
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
      continue;
    }

    if (existing.factory) {
      continue;
    }

    if (mock.factory) {
      mocksByModuleKey.set(moduleKey, mock);
      continue;
    }

    if (existing.identifierNames.length === 0 || mock.identifierNames.length === 0) {
      // A full auto-mock is present on either side. It already covers every named export, so it
      // wins outright and absorbs the selective request rather than merging names into it.
      mocksByModuleKey.set(moduleKey, mockCallContract.parse({ ...existing, identifierNames: [] }));
      continue;
    }

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

  return [...mocksByModuleKey.values()];
};
