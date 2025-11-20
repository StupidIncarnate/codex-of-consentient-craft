import { subdirNameContract } from './subdir-name-contract';
import { SubdirNameStub } from './subdir-name.stub';

describe('subdirNameContract', () => {
  describe('valid subdir names', () => {
    it('VALID: {value: "src"} => parses successfully', () => {
      const subdir = SubdirNameStub({ value: 'src' });

      const parsed = subdirNameContract.parse(subdir);

      expect(parsed).toBe('src');
    });

    it('VALID: {value: "test"} => parses different subdir', () => {
      const subdir = SubdirNameStub({ value: 'test' });

      const parsed = subdirNameContract.parse(subdir);

      expect(parsed).toBe('test');
    });
  });

  describe('invalid subdir names', () => {
    it('INVALID_SUBDIR_NAME: {value: number} => throws validation error', () => {
      expect(() => {
        return subdirNameContract.parse(123 as never);
      }).toThrow(/Expected string/u);
    });
  });
});
