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
 * a FULL-AUTO mock (`isFullAutoMockCallGuard` — no factory, identifierNames AND
 * objectIdentifierNames both empty — a bare `registerModuleMock({module})` with no factory; a
 * property-access `registerMock({fn: X.method})` no longer produces this shape, see below), and a
 * SELECTIVE mock (no factory, at least one of identifierNames/objectIdentifierNames non-empty — a
 * bare-export `registerMock`, e.g. `questListBroker`, OR a property-access `registerMock`, e.g.
 * `StartOrchestrator.getQuest`, which records `StartOrchestrator` in objectIdentifierNames).
 * Precedence is FACTORY > FULL-AUTO > SELECTIVE, decided pairwise so the result is the same
 * regardless of arrival order:
 * - An existing factory always wins; a later factory never displaces the first one to arrive.
 * - Absent a factory on either side, a FULL-AUTO request on EITHER side wins and the merged
 *   record's identifierNames/objectIdentifierNames are forced to []. Jest's automock already
 *   replaces every export with a jest.fn() (objects mocked recursively — the same recursive
 *   behaviour objectIdentifierNames' own codegen gives ONE named object), so a bare
 *   `jest.mock(module)` already covers whatever a SELECTIVE request named; nothing from that
 *   request is lost.
 * - Two SELECTIVE requests union their identifierNames and separately union their
 *   objectIdentifierNames, so each proxy's own named export (or accessed object) ends up in the
 *   one spread-real factory.
 *
 * USAGE:
 * mockCallsMergeByModuleTransformer({ mockCalls: [processCwdMock, processKillMock] });
 * // Returns one MockCall per module, identifierNames/objectIdentifierNames unioned across every
 * // specifier form
 */

import { mockCallContract } from '../../contracts/mock-call/mock-call-contract';
import { isFullAutoMockCallGuard } from '../../guards/is-full-auto-mock-call/is-full-auto-mock-call-guard';
import type { MockCall } from '../../contracts/mock-call/mock-call-contract';

export const mockCallsMergeByModuleTransformer = ({
  mockCalls,
}: {
  mockCalls: MockCall[];
}): MockCall[] => {
  const mocksByModuleKey = new Map<string, MockCall>();

  for (const mock of mockCalls) {
    const moduleKey = mock.moduleName.replace(/^node:/u, '');
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

    if (isFullAutoMockCallGuard({ mock: existing }) || isFullAutoMockCallGuard({ mock })) {
      mocksByModuleKey.set(
        moduleKey,
        mockCallContract.parse({ ...existing, identifierNames: [], objectIdentifierNames: [] }),
      );
      continue;
    }

    const mergedIdentifiers = [...existing.identifierNames];
    for (const name of mock.identifierNames) {
      if (!mergedIdentifiers.includes(name)) {
        mergedIdentifiers.push(name);
      }
    }
    const mergedObjectIdentifiers = [...existing.objectIdentifierNames];
    for (const name of mock.objectIdentifierNames) {
      if (!mergedObjectIdentifiers.includes(name)) {
        mergedObjectIdentifiers.push(name);
      }
    }
    mocksByModuleKey.set(
      moduleKey,
      mockCallContract.parse({
        ...existing,
        identifierNames: mergedIdentifiers,
        objectIdentifierNames: mergedObjectIdentifiers,
      }),
    );
  }

  return [...mocksByModuleKey.values()];
};
