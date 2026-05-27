import { tsconfigSyncPairContract } from './tsconfig-sync-pair-contract';
import { TsconfigSyncPairStub } from './tsconfig-sync-pair.stub';

describe('tsconfigSyncPairContract', () => {
  describe('valid input', () => {
    it('VALID: {default stub values} => returns TsconfigSyncPair with correct shape', () => {
      const result = TsconfigSyncPairStub();

      expect(result).toStrictEqual(
        TsconfigSyncPairStub({
          tsconfigPath: '/repo/packages/shared/tsconfig.json' as never,
          currentData: { compilerOptions: { composite: true }, references: [] },
          expectedRefs: [],
          ensureComposite: true,
        }),
      );
    });

    it('VALID: {ensureComposite: false, empty refs} => returns pair with overridden values', () => {
      const result = TsconfigSyncPairStub({ ensureComposite: false });

      expect(result).toStrictEqual(
        TsconfigSyncPairStub({
          ensureComposite: false,
          tsconfigPath: '/repo/packages/shared/tsconfig.json' as never,
          currentData: { compilerOptions: { composite: true }, references: [] },
          expectedRefs: [],
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {missing tsconfigPath} => throws Required', () => {
      expect(() =>
        tsconfigSyncPairContract.parse({
          currentData: {},
          expectedRefs: [],
          ensureComposite: true,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {ensureComposite: not boolean} => throws Expected boolean', () => {
      expect(() =>
        tsconfigSyncPairContract.parse({
          tsconfigPath: '/repo/tsconfig.json',
          currentData: {},
          expectedRefs: [],
          ensureComposite: 'yes' as never,
        }),
      ).toThrow(/Expected boolean/u);
    });
  });
});
