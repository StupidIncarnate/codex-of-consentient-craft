import { hookSpawnNameExtractTransformer } from './hook-spawn-name-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('hookSpawnNameExtractTransformer', () => {
  describe('spawn with string literal argument', () => {
    it('VALID: {spawn("npm", ...)} => returns npm', () => {
      const source = ContentTextStub({ value: `spawnSync('npm', ['run', 'build'], { cwd });` });

      const result = hookSpawnNameExtractTransformer({ source });

      expect(result).toBe('npm');
    });

    it('VALID: {spawn with double-quote literal} => returns command name', () => {
      const source = ContentTextStub({ value: `spawn("git", ["worktree", "add", path])` });

      const result = hookSpawnNameExtractTransformer({ source });

      expect(result).toBe('git');
    });
  });

  describe('spawn without string literal argument', () => {
    it('VALID: {spawn(variable)} => returns (subprocess)', () => {
      const source = ContentTextStub({ value: `const proc = spawn(cmd, args, options);` });

      const result = hookSpawnNameExtractTransformer({ source });

      expect(result).toBe('(subprocess)');
    });
  });

  describe('no spawn call', () => {
    it('EMPTY: {source without spawn} => returns undefined', () => {
      const source = ContentTextStub({
        value: `import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';`,
      });

      const result = hookSpawnNameExtractTransformer({ source });

      expect(result).toBe(undefined);
    });
  });
});
