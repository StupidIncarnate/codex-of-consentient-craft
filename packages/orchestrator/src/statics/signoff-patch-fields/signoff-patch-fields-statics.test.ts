import { signoffPatchFieldsStatics } from './signoff-patch-fields-statics';

describe('signoffPatchFieldsStatics', () => {
  describe('signoffFields', () => {
    it('EMPTY: {signoffFields} => empty list because sign-off fields are retired', () => {
      expect(signoffPatchFieldsStatics.signoffFields).toStrictEqual([]);
    });
  });

  describe('allowedOnSigningElement', () => {
    it('VALID: {allowedOnSigningElement} => contains `id` and no sign-off fields', () => {
      expect(signoffPatchFieldsStatics.allowedOnSigningElement).toStrictEqual(['id']);
    });

    it('VALID: {every sign-off field} => empty list when filtered against allowedOnSigningElement', () => {
      const allowed = new Set(signoffPatchFieldsStatics.allowedOnSigningElement.map(String));

      expect(
        signoffPatchFieldsStatics.signoffFields.filter((field) => allowed.has(field)),
      ).toStrictEqual([]);
    });
  });

  describe('allowedOnSigningNode', () => {
    it('VALID: {allowedOnSigningNode} => `id` plus the `observables` container', () => {
      expect(signoffPatchFieldsStatics.allowedOnSigningNode).toStrictEqual(['id', 'observables']);
    });
  });

  describe('structure', () => {
    it('VALID: {lists} => empty signoffFields with container keys for signing elements and nodes', () => {
      expect({
        signoffFields: signoffPatchFieldsStatics.signoffFields.map(String),
        allowedOnSigningElement: signoffPatchFieldsStatics.allowedOnSigningElement.map(String),
        allowedOnSigningNode: signoffPatchFieldsStatics.allowedOnSigningNode.map(String),
      }).toStrictEqual({
        signoffFields: [],
        allowedOnSigningElement: ['id'],
        allowedOnSigningNode: ['id', 'observables'],
      });
    });
  });

  describe('full exported value', () => {
    it('VALID: {statics} => matches the complete sign-off patch field map with retired sign-offs', () => {
      expect(signoffPatchFieldsStatics).toStrictEqual({
        signoffFields: [],
        allowedOnSigningElement: ['id'],
        allowedOnSigningNode: ['id', 'observables'],
      });
    });
  });
});
