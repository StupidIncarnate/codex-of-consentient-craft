import { locationsRepoLinkPathFindBroker } from './locations-repo-link-path-find-broker';
import { locationsRepoLinkPathFindBrokerProxy } from './locations-repo-link-path-find-broker.proxy';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { RepoLocalPathStub } from '../../../contracts/repo-local-path/repo-local-path.stub';

describe('locationsRepoLinkPathFindBroker', () => {
  describe('the link resolves to this machine siegelense root', () => {
    it('VALID: {homePath under the siegelense home} => returns the repo-local form with linkPresent true', async () => {
      const proxy = locationsRepoLinkPathFindBrokerProxy();
      const homePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_1',
      });

      proxy.setupLinkResolvesToRoot({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
      });

      const result = await locationsRepoLinkPathFindBroker({ homePath });

      expect(result).toStrictEqual(
        RepoLocalPathStub({
          path: AbsoluteFilePathStub({
            value: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1',
          }),
          linkPresent: true,
        }),
      );
    });
  });

  describe('no siegelense-assets symlink at the repo root', () => {
    it('EMPTY: {init has not run here} => returns the real home path with linkPresent false', async () => {
      const proxy = locationsRepoLinkPathFindBrokerProxy();
      const homePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_1',
      });

      proxy.setupLinkAbsent({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
      });

      const result = await locationsRepoLinkPathFindBroker({ homePath });

      expect(result).toStrictEqual(RepoLocalPathStub({ path: homePath, linkPresent: false }));
    });

    it('VALID: {repoRoot} => joins the dungeonmaster-assets dir before the siegelense link name', async () => {
      const proxy = locationsRepoLinkPathFindBrokerProxy();
      const homePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_1',
      });

      proxy.setupLinkAbsent({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
      });

      await locationsRepoLinkPathFindBroker({ homePath });

      expect(proxy.getJoinedSegments()).toStrictEqual([
        '/repo',
        locationsStatics.repoRoot.dungeonmasterAssets,
        locationsStatics.repoRoot.siegelenseLink,
      ]);
    });
  });

  describe('the link resolves into a different tree', () => {
    it('EDGE: {siegelense-assets left over from another checkout} => returns the real home path with linkPresent false', async () => {
      const proxy = locationsRepoLinkPathFindBrokerProxy();
      const homePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_1',
      });

      proxy.setupLinkPointsElsewhere({
        cwdPath: '/repo',
        linkPath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
        elsewhereTarget: '/other/checkout/.dungeonmaster/siegelense',
      });

      const result = await locationsRepoLinkPathFindBroker({ homePath });

      expect(result).toStrictEqual(RepoLocalPathStub({ path: homePath, linkPresent: false }));
    });
  });
});
