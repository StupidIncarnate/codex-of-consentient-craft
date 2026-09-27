import { mockFnIdentifierNamesTransformer } from './mock-fn-identifier-names-transformer';
import { IdentifierNameStub } from '../../contracts/identifier-name/identifier-name.stub';

describe('mockFnIdentifierNamesTransformer', () => {
  describe('bare named import', () => {
    it('VALID: {exportName: "join", isPropertyAccess: false} => returns identifierNames: [join], objectIdentifierNames: []', () => {
      const result = mockFnIdentifierNamesTransformer({
        exportName: IdentifierNameStub({ value: 'join' }),
        isPropertyAccess: false,
        rootIdentifier: IdentifierNameStub({ value: 'join' }),
      });

      expect(result).toStrictEqual({ identifierNames: ['join'], objectIdentifierNames: [] });
    });
  });

  describe('property access', () => {
    it('VALID: {exportName: "StartOrchestrator", isPropertyAccess: true} => returns identifierNames: [], objectIdentifierNames: [StartOrchestrator]', () => {
      const result = mockFnIdentifierNamesTransformer({
        exportName: IdentifierNameStub({ value: 'StartOrchestrator' }),
        isPropertyAccess: true,
        rootIdentifier: IdentifierNameStub({ value: 'StartOrchestrator' }),
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
        rootIdentifier: IdentifierNameStub({ value: 'defaultImportedNamespace' }),
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
        rootIdentifier: IdentifierNameStub({ value: 'somethingUnresolved' }),
      });

      expect(result).toStrictEqual({ identifierNames: [], objectIdentifierNames: [] });
    });
  });
});
