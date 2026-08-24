import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { hasPassthroughMatchGuard } from '../../guards/has-passthrough-match/has-passthrough-match-guard';
import { CliArgStub } from '../../contracts/cli-arg/cli-arg.stub';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';
import { WardConfigStub } from '../../contracts/ward-config/ward-config.stub';
import { passthroughNormalizeTransformer } from './passthrough-normalize-transformer';

describe('passthroughNormalizeTransformer', () => {
  describe('the two forms the orchestrator mandates', () => {
    it('VALID: {"./packages/ward/src/a.ts"} => strips the leading "./"', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const { passthrough } = WardConfigStub({ passthrough: ['./packages/ward/src/a.ts'] });

      const result = passthroughNormalizeTransformer({ passthrough, rootPath });

      expect(result).toStrictEqual(
        WardConfigStub({ passthrough: ['packages/ward/src/a.ts'] }).passthrough,
      );
    });

    it('VALID: {absolute path under rootPath} => returns it repo-relative', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const { passthrough } = WardConfigStub({
        passthrough: ['/home/user/project/packages/ward/src/b.ts'],
      });

      const result = passthroughNormalizeTransformer({ passthrough, rootPath });

      expect(result).toStrictEqual(
        WardConfigStub({ passthrough: ['packages/ward/src/b.ts'] }).passthrough,
      );
    });

    it('VALID: {both broken forms plus a bare one} => all three normalize to the same path', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const { passthrough } = WardConfigStub({
        passthrough: [
          './packages/ward/src/a.ts',
          '/home/user/project/packages/ward/src/a.ts',
          'packages/ward/src/a.ts',
        ],
      });

      const result = passthroughNormalizeTransformer({ passthrough, rootPath });

      expect(result).toStrictEqual(
        WardConfigStub({
          passthrough: [
            'packages/ward/src/a.ts',
            'packages/ward/src/a.ts',
            'packages/ward/src/a.ts',
          ],
        }).passthrough,
      );
    });
  });

  describe('regression: a normalized path MATCHES its package, an un-normalized one does not', () => {
    it('VALID: {"./packages/hooks/src/foo.ts"} => the guard says false before and true after', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const { passthrough } = WardConfigStub({ passthrough: ['./packages/hooks/src/foo.ts'] });

      const beforeMatch = hasPassthroughMatchGuard({
        passthroughArg: CliArgStub({ value: String(passthrough?.[0]) }),
        projectFolder,
        rootPath,
      });

      const normalized = passthroughNormalizeTransformer({ passthrough, rootPath });
      const afterMatch = hasPassthroughMatchGuard({
        passthroughArg: CliArgStub({ value: String(normalized?.[0]) }),
        projectFolder,
        rootPath,
      });

      expect(beforeMatch).toBe(false);
      expect(afterMatch).toBe(true);
    });

    it('VALID: {absolute path under rootPath} => the guard says false before and true after', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const projectFolder = ProjectFolderStub({ path: '/home/user/project/packages/hooks' });
      const { passthrough } = WardConfigStub({
        passthrough: ['/home/user/project/packages/hooks/src/foo.ts'],
      });

      const beforeMatch = hasPassthroughMatchGuard({
        passthroughArg: CliArgStub({ value: String(passthrough?.[0]) }),
        projectFolder,
        rootPath,
      });

      const normalized = passthroughNormalizeTransformer({ passthrough, rootPath });
      const afterMatch = hasPassthroughMatchGuard({
        passthroughArg: CliArgStub({ value: String(normalized?.[0]) }),
        projectFolder,
        rootPath,
      });

      expect(beforeMatch).toBe(false);
      expect(afterMatch).toBe(true);
    });
  });

  describe('paths it leaves alone', () => {
    it('VALID: {already repo-relative, file and bare package} => returns them unchanged', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const { passthrough } = WardConfigStub({
        passthrough: ['packages/ward/src/a.ts', 'packages/hooks'],
      });

      const result = passthroughNormalizeTransformer({ passthrough, rootPath });

      expect(result).toStrictEqual(
        WardConfigStub({ passthrough: ['packages/ward/src/a.ts', 'packages/hooks'] }).passthrough,
      );
    });

    it('EDGE: {absolute path OUTSIDE rootPath} => returns it unchanged rather than rewriting it', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const { passthrough } = WardConfigStub({
        passthrough: ['/home/user/other-repo/packages/ward/src/a.ts'],
      });

      const result = passthroughNormalizeTransformer({ passthrough, rootPath });

      expect(result).toStrictEqual(
        WardConfigStub({ passthrough: ['/home/user/other-repo/packages/ward/src/a.ts'] })
          .passthrough,
      );
    });

    it('EDGE: {a sibling root whose name extends this one} => is not treated as being inside it', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const { passthrough } = WardConfigStub({
        passthrough: ['/home/user/project-two/packages/ward/src/a.ts'],
      });

      const result = passthroughNormalizeTransformer({ passthrough, rootPath });

      expect(result).toStrictEqual(
        WardConfigStub({ passthrough: ['/home/user/project-two/packages/ward/src/a.ts'] })
          .passthrough,
      );
    });
  });

  describe('no passthrough', () => {
    it('EMPTY: {passthrough undefined} => returns undefined', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const result = passthroughNormalizeTransformer({ passthrough: undefined, rootPath });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {passthrough empty array} => returns an empty array', () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const { passthrough } = WardConfigStub({ passthrough: [] });

      const result = passthroughNormalizeTransformer({ passthrough, rootPath });

      expect(result).toStrictEqual(WardConfigStub({ passthrough: [] }).passthrough);
    });
  });
});
