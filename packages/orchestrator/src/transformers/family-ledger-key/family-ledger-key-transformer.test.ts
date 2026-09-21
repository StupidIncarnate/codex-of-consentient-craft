import { questFlowStatics } from '@dungeonmaster/shared/statics';

import { familyLedgerKeyTransformer } from './family-ledger-key-transformer';

// Read off the family graph rather than retyped, so a family added there with no row in the table
// fails HERE rather than resolving to nothing at the two call sites.
const FAMILY_ENTRIES = Object.entries(questFlowStatics.feature.families);

describe('familyLedgerKeyTransformer', () => {
  describe('every family the graph declares', () => {
    it.each(FAMILY_ENTRIES)(
      'VALID: {family: %s} => a ledger key carrying that family own role',
      (family, entry) => {
        expect(familyLedgerKeyTransformer({ family }).role).toBe(entry.role);
      },
    );
  });

  describe('the one family whose key is not a role name read back', () => {
    it("VALID: {family: 'wardFull'} => { role: 'ward' }, the role no family key spells", () => {
      expect(familyLedgerKeyTransformer({ family: 'wardFull' })).toStrictEqual({
        role: 'ward',
      });
    });
  });

  describe('a family whose key IS its role name', () => {
    it("VALID: {family: 'codeweaver'} => { role: 'codeweaver' }", () => {
      expect(familyLedgerKeyTransformer({ family: 'codeweaver' })).toStrictEqual({
        role: 'codeweaver',
      });
    });

    it("VALID: {family: 'warpgate'} => { role: 'warpgate' } even though nothing routes to it", () => {
      expect(familyLedgerKeyTransformer({ family: 'warpgate' })).toStrictEqual({
        role: 'warpgate',
      });
    });
  });

  describe('a name that is a role but not a family', () => {
    it("INVALID: {family: 'ward'} => throws naming every family, because 'ward' is the ROLE and 'wardFull' is the family", () => {
      expect(() => familyLedgerKeyTransformer({ family: 'ward' })).toThrow(
        /^familyLedgerKeyTransformer: no ledger key for family 'ward' — the families are: riftcarver, codeweaver, flowrider, siegemaster, wardFull, warpgate$/u,
      );
    });
  });
});
