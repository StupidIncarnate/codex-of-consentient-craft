import { TsconfigJsonWritableStub } from '../../contracts/tsconfig-json-writable/tsconfig-json-writable.stub';
import { TsconfigReferenceStub } from '../../contracts/tsconfig-reference/tsconfig-reference.stub';
import { tsconfigUpdateReferencesTransformer } from './tsconfig-update-references-transformer';

describe('tsconfigUpdateReferencesTransformer()', () => {
  describe('ensureComposite: false', () => {
    it('VALID: {empty tsconfig, no refs} => sets empty references array', () => {
      const result = tsconfigUpdateReferencesTransformer({
        tsconfigData: TsconfigJsonWritableStub({
          compilerOptions: undefined,
          references: undefined,
        }),
        references: [],
        ensureComposite: false,
      });

      expect(result).toStrictEqual({ compilerOptions: { composite: true }, references: [] });
    });

    it('VALID: {existing tsconfig, one ref} => sets references, preserves other fields', () => {
      const ref = TsconfigReferenceStub({ path: '../shared' });
      const result = tsconfigUpdateReferencesTransformer({
        tsconfigData: TsconfigJsonWritableStub({
          compilerOptions: { composite: true },
          include: ['src/**/*'],
        }),
        references: [ref],
        ensureComposite: false,
      });

      expect(result).toStrictEqual({
        compilerOptions: { composite: true },
        include: ['src/**/*'],
        references: [{ path: '../shared' }],
      });
    });

    it('VALID: {two refs} => sets references in provided order', () => {
      const shared = TsconfigReferenceStub({ path: '../shared' });
      const hooks = TsconfigReferenceStub({ path: '../hooks' });
      const result = tsconfigUpdateReferencesTransformer({
        tsconfigData: TsconfigJsonWritableStub({
          compilerOptions: undefined,
          references: undefined,
        }),
        references: [shared, hooks],
        ensureComposite: false,
      });

      expect(result).toStrictEqual({
        compilerOptions: { composite: true },
        references: [{ path: '../shared' }, { path: '../hooks' }],
      });
    });
  });

  describe('ensureComposite: true', () => {
    it('VALID: {no compilerOptions} => adds composite: true to new compilerOptions', () => {
      const ref = TsconfigReferenceStub({ path: '../shared' });
      const result = tsconfigUpdateReferencesTransformer({
        tsconfigData: TsconfigJsonWritableStub({
          compilerOptions: undefined,
          references: undefined,
        }),
        references: [ref],
        ensureComposite: true,
      });

      expect(result).toStrictEqual({
        compilerOptions: { composite: true },
        references: [{ path: '../shared' }],
      });
    });

    it('VALID: {compilerOptions without composite} => adds composite: true, preserves existing options', () => {
      const ref = TsconfigReferenceStub({ path: '../shared' });
      const result = tsconfigUpdateReferencesTransformer({
        tsconfigData: TsconfigJsonWritableStub({
          compilerOptions: { noEmit: false },
          references: undefined,
        }),
        references: [ref],
        ensureComposite: true,
      });

      expect(result).toStrictEqual({
        compilerOptions: { noEmit: false, composite: true },
        references: [{ path: '../shared' }],
      });
    });

    it('VALID: {composite already true} => does not add duplicate composite', () => {
      const ref = TsconfigReferenceStub({ path: '../shared' });
      const result = tsconfigUpdateReferencesTransformer({
        tsconfigData: TsconfigJsonWritableStub({
          compilerOptions: { composite: true },
          references: undefined,
        }),
        references: [ref],
        ensureComposite: true,
      });

      expect(result).toStrictEqual({
        compilerOptions: { composite: true },
        references: [{ path: '../shared' }],
      });
    });

    it('VALID: {empty refs, ensureComposite} => sets empty references and composite', () => {
      const result = tsconfigUpdateReferencesTransformer({
        tsconfigData: TsconfigJsonWritableStub({
          compilerOptions: undefined,
          references: undefined,
        }),
        references: [],
        ensureComposite: true,
      });

      expect(result).toStrictEqual({
        compilerOptions: { composite: true },
        references: [],
      });
    });
  });
});
