import { instanceManifestContract } from './instance-manifest-contract';
import { InstanceManifestStub } from './instance-manifest.stub';

describe('instanceManifestContract', () => {
  describe('valid manifests', () => {
    it('VALID: {a quest-owned instance, every link present} => parses the complete manifest', () => {
      const manifest = InstanceManifestStub({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://localhost:34173',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        logs: {
          api: {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/api-server.log',
            linkPresent: true,
          },
          web: {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/web-server.log',
            linkPresent: true,
          },
        },
        seeded: null,
        queuedMs: 34_000,
        aheadOfMe: 2,
        bootMs: 21_000,
      });

      const result = instanceManifestContract.parse(manifest);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://localhost:34173',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        logs: {
          api: {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/api-server.log',
            linkPresent: true,
          },
          web: {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/web-server.log',
            linkPresent: true,
          },
        },
        seeded: null,
        queuedMs: 34_000,
        aheadOfMe: 2,
        bootMs: 21_000,
      });
    });

    it('VALID: {an unowned instance, evidence under unowned/} => parses with the unowned partition in the path', () => {
      const manifest = InstanceManifestStub({
        evidence: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        logs: {
          api: {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21/api-server.log',
            linkPresent: true,
          },
          web: {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21/web-server.log',
            linkPresent: true,
          },
        },
      });

      const result = instanceManifestContract.parse(manifest);

      expect(result.evidence).toStrictEqual({
        path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21',
        linkPresent: true,
      });
    });

    it('VALID: {every RepoLocalPath carries linkPresent: false} => the missing-link branch survives into the manifest', () => {
      const manifest = InstanceManifestStub({
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: false,
        },
        logs: {
          api: {
            path: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_7f3a9c21/api-server.log',
            linkPresent: false,
          },
          web: {
            path: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_7f3a9c21/web-server.log',
            linkPresent: false,
          },
        },
      });

      const result = instanceManifestContract.parse(manifest);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://localhost:34173',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: false,
        },
        logs: {
          api: {
            path: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_7f3a9c21/api-server.log',
            linkPresent: false,
          },
          web: {
            path: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_7f3a9c21/web-server.log',
            linkPresent: false,
          },
        },
        seeded: null,
        queuedMs: 34_000,
        aheadOfMe: 2,
        bootMs: 21_000,
      });
    });

    it('EDGE: {aheadOfMe: 0} => a start with nothing queued ahead of it still parses', () => {
      const manifest = InstanceManifestStub({ aheadOfMe: 0 });

      const result = instanceManifestContract.parse(manifest);

      expect(result.aheadOfMe).toBe(0);
    });

    it('EDGE: {baseUrl: null} => a browserless instance parses with no base URL', () => {
      const manifest = InstanceManifestStub({ baseUrl: null });

      const result = instanceManifestContract.parse(manifest);

      expect(result.baseUrl).toBe(null);
    });
  });

  describe('the tool-response round trip', () => {
    it('VALID: {a complete manifest} => JSON.stringify then parse round-trips', () => {
      const manifest = InstanceManifestStub();

      const wireFrame: unknown = JSON.parse(JSON.stringify(manifest));
      const result = instanceManifestContract.parse(wireFrame);

      expect(result).toStrictEqual(manifest);
    });
  });

  describe('invalid manifests', () => {
    it('INVALID: {missing instanceId} => throws Required', () => {
      expect(() =>
        instanceManifestContract.parse({
          specName: 'dungeonmaster-stack',
          baseUrl: 'http://localhost:34173',
          home: '/tmp/dm-siege-inst_7f3a9c21',
          evidence: {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
            linkPresent: true,
          },
          logs: {
            api: {
              path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/api-server.log',
              linkPresent: true,
            },
            web: {
              path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21/web-server.log',
              linkPresent: true,
            },
          },
          seeded: null,
          queuedMs: 34_000,
          aheadOfMe: 2,
          bootMs: 21_000,
        }),
      ).toThrow(/Required/u);
    });
  });
});
