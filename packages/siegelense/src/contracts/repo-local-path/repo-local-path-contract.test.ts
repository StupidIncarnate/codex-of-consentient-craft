import { repoLocalPathContract } from './repo-local-path-contract';
import { RepoLocalPathStub } from './repo-local-path.stub';

describe('repoLocalPathContract', () => {
  describe('valid values', () => {
    it('VALID: {linkPresent: true} => parses the symlinked repo-local path', () => {
      const location = RepoLocalPathStub({
        path: '/repo/.siegelense/guilds/g1/instances/inst_1',
        linkPresent: true,
      });

      const result = repoLocalPathContract.parse(location);

      expect(result).toStrictEqual({
        path: '/repo/.siegelense/guilds/g1/instances/inst_1',
        linkPresent: true,
      });
    });

    it('VALID: {linkPresent: false} => parses the real home path with the link marked missing', () => {
      const location = RepoLocalPathStub({
        path: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_1',
        linkPresent: false,
      });

      const result = repoLocalPathContract.parse(location);

      expect(result).toStrictEqual({
        path: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_1',
        linkPresent: false,
      });
    });
  });

  describe('edge values', () => {
    it('EDGE: {path: "/"} => parses the shortest possible absolute path', () => {
      const location = RepoLocalPathStub({ path: '/', linkPresent: true });

      const result = repoLocalPathContract.parse(location);

      expect(result).toStrictEqual({ path: '/', linkPresent: true });
    });
  });

  describe('invalid values', () => {
    it('INVALID: {path: relative path} => throws absolute-path error', () => {
      expect(() =>
        repoLocalPathContract.parse({ path: 'repo/.siegelense', linkPresent: true }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {missing linkPresent} => throws Required', () => {
      expect(() => repoLocalPathContract.parse({ path: '/repo/.siegelense' })).toThrow(/Required/u);
    });
  });
});
