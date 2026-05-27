import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { TsconfigJsonWritableStub } from '../../contracts/tsconfig-json-writable/tsconfig-json-writable.stub';
import { TsconfigReferenceStub } from '../../contracts/tsconfig-reference/tsconfig-reference.stub';
import { isTsconfigPairDriftedGuard } from './is-tsconfig-pair-drifted-guard';

describe('isTsconfigPairDriftedGuard()', () => {
  describe('undefined input', () => {
    it('EMPTY: {pair: undefined} => returns false', () => {
      const result = isTsconfigPairDriftedGuard({});

      expect(result).toBe(false);
    });
  });

  describe('references match and composite not required', () => {
    it('VALID: {no refs expected, no refs on disk, ensureComposite: false} => returns false', () => {
      const result = isTsconfigPairDriftedGuard({
        pair: {
          tsconfigPath: AbsoluteFilePathStub({ value: '/repo/tsconfig.json' }),
          currentData: TsconfigJsonWritableStub({ compilerOptions: undefined, references: [] }),
          expectedRefs: [],
          ensureComposite: false,
        },
      });

      expect(result).toBe(false);
    });

    it('VALID: {refs match, ensureComposite: false} => returns false', () => {
      const ref = TsconfigReferenceStub({ path: '../shared' });
      const result = isTsconfigPairDriftedGuard({
        pair: {
          tsconfigPath: AbsoluteFilePathStub({ value: '/repo/tsconfig.json' }),
          currentData: TsconfigJsonWritableStub({
            compilerOptions: undefined,
            references: [{ path: ref.path }],
          }),
          expectedRefs: [ref],
          ensureComposite: false,
        },
      });

      expect(result).toBe(false);
    });
  });

  describe('references drift', () => {
    it('INVALID: {on-disk refs empty, expected has one ref} => returns true', () => {
      const ref = TsconfigReferenceStub({ path: '../shared' });
      const result = isTsconfigPairDriftedGuard({
        pair: {
          tsconfigPath: AbsoluteFilePathStub({ value: '/repo/packages/hooks/tsconfig.json' }),
          currentData: TsconfigJsonWritableStub({ compilerOptions: undefined, references: [] }),
          expectedRefs: [ref],
          ensureComposite: false,
        },
      });

      expect(result).toBe(true);
    });

    it('INVALID: {on-disk refs differ from expected} => returns true', () => {
      const shared = TsconfigReferenceStub({ path: '../shared' });
      const hooks = TsconfigReferenceStub({ path: '../hooks' });
      const result = isTsconfigPairDriftedGuard({
        pair: {
          tsconfigPath: AbsoluteFilePathStub({ value: '/repo/packages/mcp/tsconfig.json' }),
          currentData: TsconfigJsonWritableStub({
            compilerOptions: undefined,
            references: [{ path: shared.path }],
          }),
          expectedRefs: [shared, hooks],
          ensureComposite: false,
        },
      });

      expect(result).toBe(true);
    });
  });

  describe('composite drift', () => {
    it('INVALID: {refs match, ensureComposite: true, composite absent} => returns true', () => {
      const ref = TsconfigReferenceStub({ path: '../shared' });
      const result = isTsconfigPairDriftedGuard({
        pair: {
          tsconfigPath: AbsoluteFilePathStub({ value: '/repo/packages/hooks/tsconfig.json' }),
          currentData: TsconfigJsonWritableStub({
            compilerOptions: { noEmit: false },
            references: [{ path: ref.path }],
          }),
          expectedRefs: [ref],
          ensureComposite: true,
        },
      });

      expect(result).toBe(true);
    });

    it('VALID: {refs match, ensureComposite: true, composite: true} => returns false', () => {
      const ref = TsconfigReferenceStub({ path: '../shared' });
      const result = isTsconfigPairDriftedGuard({
        pair: {
          tsconfigPath: AbsoluteFilePathStub({ value: '/repo/packages/hooks/tsconfig.json' }),
          currentData: TsconfigJsonWritableStub({
            compilerOptions: { composite: true },
            references: [{ path: ref.path }],
          }),
          expectedRefs: [ref],
          ensureComposite: true,
        },
      });

      expect(result).toBe(false);
    });
  });
});
