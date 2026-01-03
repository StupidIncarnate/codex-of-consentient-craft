import { relativePathContract } from './relative-path-contract';
import { RelativePathStub } from './relative-path.stub';

describe('relativePathContract', () => {
  describe('valid paths', () => {
    it('VALID: ".claude/settings.json" => returns RelativePath', () => {
      const result = relativePathContract.parse('.claude/settings.json');

      expect(result).toBe('.claude/settings.json');
    });

    it('VALID: "src/index.ts" => returns RelativePath', () => {
      const result = relativePathContract.parse('src/index.ts');

      expect(result).toBe('src/index.ts');
    });

    it('VALID: "package.json" => returns RelativePath', () => {
      const result = relativePathContract.parse('package.json');

      expect(result).toBe('package.json');
    });
  });

  describe('RelativePathStub', () => {
    it('VALID: {value: ".claude/settings.json"} => returns RelativePath', () => {
      const result = RelativePathStub({ value: '.claude/settings.json' });

      expect(result).toBe('.claude/settings.json');
    });
  });
});
