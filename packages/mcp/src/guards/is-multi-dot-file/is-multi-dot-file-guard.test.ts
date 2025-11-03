import { isMultiDotFileGuard } from './is-multi-dot-file-guard';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';

describe('isMultiDotFileGuard', () => {
  it('VALID: returns true for .test.ts files', () => {
    const filepath = FilePathStub({ value: '/test/user-broker.test.ts' });

    const result = isMultiDotFileGuard({ filepath });

    expect(result).toBe(true);
  });

  it('VALID: returns true for .proxy.ts files', () => {
    const filepath = FilePathStub({ value: '/test/user-broker.proxy.ts' });

    const result = isMultiDotFileGuard({ filepath });

    expect(result).toBe(true);
  });

  it('VALID: returns true for .integration.test.ts files', () => {
    const filepath = FilePathStub({
      value: '/test/user-broker.integration.test.ts',
    });

    const result = isMultiDotFileGuard({ filepath });

    expect(result).toBe(true);
  });

  it('VALID: returns true for .spec.ts files', () => {
    const filepath = FilePathStub({ value: '/test/user-broker.spec.ts' });

    const result = isMultiDotFileGuard({ filepath });

    expect(result).toBe(true);
  });

  it('VALID: returns false for regular .ts files', () => {
    const filepath = FilePathStub({ value: '/test/user-broker.ts' });

    const result = isMultiDotFileGuard({ filepath });

    expect(result).toBe(false);
  });

  it('VALID: returns false for files with hyphenated names', () => {
    const filepath = FilePathStub({ value: '/test/user-fetch-broker.ts' });

    const result = isMultiDotFileGuard({ filepath });

    expect(result).toBe(false);
  });

  it('VALID: returns false for undefined filepath', () => {
    const result = isMultiDotFileGuard({ filepath: undefined as never });

    expect(result).toBe(false);
  });

  it('VALID: returns true for .tsx multi-dot files', () => {
    const filepath = FilePathStub({ value: '/test/component.test.tsx' });

    const result = isMultiDotFileGuard({ filepath });

    expect(result).toBe(true);
  });

  it('VALID: returns false for regular .tsx files', () => {
    const filepath = FilePathStub({ value: '/test/component.tsx' });

    const result = isMultiDotFileGuard({ filepath });

    expect(result).toBe(false);
  });
});
