import { mockFnIdentifierNamesTransformer } from './mock-fn-identifier-names-transformer';

describe('mockFnIdentifierNamesTransformer', () => {
  describe('bare named import', () => {
    it('VALID: {exportName: "join", isPropertyAccess: false} => returns identifierNames: [join], objectIdentifierNames: []', () => {
      const result = mockFnIdentifierNamesTransformer({
        exportName: 'join',
        isPropertyAccess: false,
        rootIdentifier: 'join',
      });

      expect(result).toStrictEqual({ identifierNames: ['join'], objectIdentifierNames: [] });
    });
  });

  describe('property access', () => {
    it('VALID: {exportName: "StartOrchestrator", isPropertyAccess: true} => returns identifierNames: [], objectIdentifierNames: [StartOrchestrator]', () => {
      const result = mockFnIdentifierNamesTransformer({
        exportName: 'StartOrchestrator',
        isPropertyAccess: true,
        rootIdentifier: 'StartOrchestrator',
      });

      expect(result).toStrictEqual({
        identifierNames: [],
        objectIdentifierNames: ['StartOrchestrator'],
      });
    });

    it('EMPTY: {exportName: undefined, isPropertyAccess: true} => falls back to rootIdentifier for objectIdentifierNames', () => {
      const result = mockFnIdentifierNamesTransformer({
        exportName: undefined,
        isPropertyAccess: true,
        rootIdentifier: 'defaultImportedNamespace',
      });

      expect(result).toStrictEqual({
        identifierNames: [],
        objectIdentifierNames: ['defaultImportedNamespace'],
      });
    });
  });

  describe('unresolved bare export', () => {
    it('EMPTY: {exportName: undefined, isPropertyAccess: false} => returns both arrays empty', () => {
      const result = mockFnIdentifierNamesTransformer({
        exportName: undefined,
        isPropertyAccess: false,
        rootIdentifier: 'somethingUnresolved',
      });

      expect(result).toStrictEqual({ identifierNames: [], objectIdentifierNames: [] });
    });
  });
});
