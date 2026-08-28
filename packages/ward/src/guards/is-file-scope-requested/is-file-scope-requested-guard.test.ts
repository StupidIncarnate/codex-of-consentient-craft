import { WardConfigStub } from '../../contracts/ward-config/ward-config.stub';
import { isFileScopeRequestedGuard } from './is-file-scope-requested-guard';

describe('isFileScopeRequestedGuard', () => {
  // One test per FILE-SCOPING field rather than an `it.each`: each names a different way a caller
  // asks for a file set, and the classification table they are proving is not exported to derive a
  // list from — exporting it would put a second export in a single-responsibility file.
  describe('file-scoping fields', () => {
    it('VALID: {changed: true} => returns true', () => {
      const config = WardConfigStub({ changed: true });

      expect(isFileScopeRequestedGuard({ config })).toBe(true);
    });

    it('VALID: {staged: true} => returns true', () => {
      const config = WardConfigStub({ staged: true });

      expect(isFileScopeRequestedGuard({ config })).toBe(true);
    });

    it('VALID: {passthrough: ["packages/ward/src/index.ts"]} => returns true', () => {
      const config = WardConfigStub({ passthrough: ['packages/ward/src/index.ts'] });

      expect(isFileScopeRequestedGuard({ config })).toBe(true);
    });
  });

  // THE CASE THE HARDCODED `config.staged === true || config.changed === true` MISSED. An empty
  // list is a file scope that resolved to nothing; read as "no scope" it means the whole repo.
  describe('a file scope that resolved to nothing', () => {
    it('EMPTY: {passthrough: []} => returns true', () => {
      const config = WardConfigStub({ passthrough: [] });

      expect(isFileScopeRequestedGuard({ config })).toBe(true);
    });
  });

  describe('fields that scope something other than files', () => {
    it('VALID: {only: ["lint"]} => returns false', () => {
      const config = WardConfigStub({ only: ['lint'] });

      expect(isFileScopeRequestedGuard({ config })).toBe(false);
    });

    it('VALID: {onlyTests: "my specific test"} => returns false', () => {
      const config = WardConfigStub({ onlyTests: 'my specific test' });

      expect(isFileScopeRequestedGuard({ config })).toBe(false);
    });

    it('VALID: {only, onlyTests together} => returns false', () => {
      const config = WardConfigStub({ only: ['lint', 'unit'], onlyTests: 'my specific test' });

      expect(isFileScopeRequestedGuard({ config })).toBe(false);
    });
  });

  describe('no scope at all', () => {
    it('EMPTY: {} => returns false', () => {
      const config = WardConfigStub();

      expect(isFileScopeRequestedGuard({ config })).toBe(false);
    });

    it('EDGE: {changed: false, staged: false} => returns false', () => {
      const config = WardConfigStub({ changed: false, staged: false });

      expect(isFileScopeRequestedGuard({ config })).toBe(false);
    });

    it('EMPTY: {config omitted} => returns false', () => {
      expect(isFileScopeRequestedGuard({})).toBe(false);
    });
  });
});
