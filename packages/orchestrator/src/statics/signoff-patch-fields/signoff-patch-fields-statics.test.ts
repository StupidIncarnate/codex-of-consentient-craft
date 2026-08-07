import { signoffPatchFieldsStatics } from './signoff-patch-fields-statics';

describe('signoffPatchFieldsStatics', () => {
  describe('signoffFields', () => {
    it('VALID: {signoffFields} => names both tracks, so either one marks an element as signing', () => {
      expect(signoffPatchFieldsStatics.signoffFields).toStrictEqual([
        'flowriderSignoff',
        'siegemasterSignoff',
      ]);
    });
  });

  describe('allowedOnSigningElement', () => {
    it('VALID: {allowedOnSigningElement} => `id` plus the two sign-off fields and nothing else', () => {
      expect(signoffPatchFieldsStatics.allowedOnSigningElement).toStrictEqual([
        'id',
        'flowriderSignoff',
        'siegemasterSignoff',
      ]);
    });

    it('VALID: {every sign-off field} => appears in the signing-element allowlist, so signing itself is never the violation', () => {
      const allowed = new Set(signoffPatchFieldsStatics.allowedOnSigningElement.map(String));

      expect(
        signoffPatchFieldsStatics.signoffFields.filter((field) => allowed.has(field)),
      ).toStrictEqual(['flowriderSignoff', 'siegemasterSignoff']);
    });
  });

  describe('allowedOnSigningNode', () => {
    it('VALID: {allowedOnSigningNode} => the element allowlist plus the `observables` container', () => {
      expect(signoffPatchFieldsStatics.allowedOnSigningNode).toStrictEqual([
        'id',
        'flowriderSignoff',
        'siegemasterSignoff',
        'observables',
      ]);
    });
  });

  describe('full exported value', () => {
    it('VALID: {statics} => matches the complete sign-off patch field map', () => {
      expect(signoffPatchFieldsStatics).toStrictEqual({
        signoffFields: ['flowriderSignoff', 'siegemasterSignoff'],
        allowedOnSigningElement: ['id', 'flowriderSignoff', 'siegemasterSignoff'],
        allowedOnSigningNode: ['id', 'flowriderSignoff', 'siegemasterSignoff', 'observables'],
      });
    });
  });
});
