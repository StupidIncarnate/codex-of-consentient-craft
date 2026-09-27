/**
 * PURPOSE: Checks whether a MockCall is a FULL-AUTO request — no factory, no selective identifier
 * and no selective object identifier — the shape a bare `registerModuleMock({module})` produces.
 * A property-access `registerMock({fn: X.method})` no longer produces this shape: it records `X` in
 * `objectIdentifierNames` instead, which this guard treats as selective, not full-auto.
 *
 * USAGE:
 * isFullAutoMockCallGuard({mock: MockCallStub({identifierNames: [], objectIdentifierNames: []})});
 * // Returns true
 */

import type { MockCall } from '../../contracts/mock-call/mock-call-contract';

export const isFullAutoMockCallGuard = ({ mock }: { mock?: MockCall }): boolean => {
  if (!mock) {
    return false;
  }
  return (
    !mock.factory && mock.identifierNames.length === 0 && mock.objectIdentifierNames.length === 0
  );
};
