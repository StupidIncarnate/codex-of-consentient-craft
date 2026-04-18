import { IdentifierStub } from '@dungeonmaster/shared/contracts';
import { matchesStatusHolderIdentifierGuard } from './matches-status-holder-identifier-guard';

describe('matchesStatusHolderIdentifierGuard', () => {
  describe('missing identifier', () => {
    it('EMPTY: {} => returns false', () => {
      expect(matchesStatusHolderIdentifierGuard({})).toBe(false);
    });

    it('EMPTY: {identifierName: ""} => returns false', () => {
      expect(
        matchesStatusHolderIdentifierGuard({ identifierName: IdentifierStub({ value: '' }) }),
      ).toBe(false);
    });
  });

  describe('default holders', () => {
    it.each(['quest', 'workItem', 'wi', 'item', 'input', 'postResult'] as const)(
      'VALID: {identifierName: %s} => returns true',
      (name) => {
        expect(
          matchesStatusHolderIdentifierGuard({
            identifierName: IdentifierStub({ value: name }),
          }),
        ).toBe(true);
      },
    );
  });

  describe('suffix regex matches', () => {
    it.each(['myQuest', 'someQuest', 'workItem', 'SomeItem', 'PendingItem'] as const)(
      'VALID: {identifierName: %s} => returns true (matches /Quest$|Item$/)',
      (name) => {
        expect(
          matchesStatusHolderIdentifierGuard({
            identifierName: IdentifierStub({ value: name }),
          }),
        ).toBe(true);
      },
    );
  });

  describe('extra allowlist (rule options)', () => {
    it('VALID: {identifierName: "record", extraAllowlist: ["record"]} => returns true', () => {
      expect(
        matchesStatusHolderIdentifierGuard({
          identifierName: IdentifierStub({ value: 'record' }),
          extraAllowlist: [IdentifierStub({ value: 'record' })],
        }),
      ).toBe(true);
    });
  });

  describe('non-matching identifiers', () => {
    it.each(['foo', 'bar', 'user', 'response', 'status'] as const)(
      'EMPTY: {identifierName: %s} => returns false',
      (name) => {
        expect(
          matchesStatusHolderIdentifierGuard({
            identifierName: IdentifierStub({ value: name }),
          }),
        ).toBe(false);
      },
    );
  });
});
