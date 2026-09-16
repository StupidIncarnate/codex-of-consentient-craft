import { killResultContract } from './kill-result-contract';
import { KillResultStub } from './kill-result.stub';

describe('killResultContract', () => {
  describe('valid results', () => {
    it('VALID: {stopped: true, a live driver answered} => parses the ordinary teardown', () => {
      const killResult = KillResultStub({
        instanceId: 'inst_7f3a9c21',
        stopped: true,
        portsReleased: [34_172, 34_173],
        homeRemoved: true,
        evidenceKept: {
          path: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        reapedPgids: [],
      });

      const result = killResultContract.parse(killResult);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        stopped: true,
        portsReleased: [34_172, 34_173],
        homeRemoved: true,
        evidenceKept: {
          path: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        reapedPgids: [],
      });
    });

    it('EDGE: {reapedPgids: [33812]} => parses the orphan-reap path for a SIGKILLed driver', () => {
      const killResult = KillResultStub({ stopped: false, reapedPgids: [33_812] });

      const result = killResultContract.parse(killResult);

      expect(result.reapedPgids).toStrictEqual([33_812]);
    });

    it('VALID: {evidenceKept.linkPresent: false} => the missing-link branch survives into the result', () => {
      const killResult = KillResultStub({
        evidenceKept: {
          path: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: false,
        },
      });

      const result = killResultContract.parse(killResult);

      expect(result.evidenceKept).toStrictEqual({
        path: '/home/user/.dungeonmaster/siegelense/guilds/g1/instances/inst_7f3a9c21',
        linkPresent: false,
      });
    });
  });

  describe('the tool-response round trip', () => {
    it('VALID: {a complete kill result} => JSON.stringify then parse round-trips', () => {
      const killResult = KillResultStub({ reapedPgids: [33_812] });

      const wireFrame: unknown = JSON.parse(JSON.stringify(killResult));
      const result = killResultContract.parse(wireFrame);

      expect(result).toStrictEqual(killResult);
    });
  });

  describe('invalid results', () => {
    it('INVALID: {missing stopped} => throws Required', () => {
      expect(() =>
        killResultContract.parse({
          instanceId: 'inst_7f3a9c21',
          portsReleased: [34_172, 34_173],
          homeRemoved: true,
          evidenceKept: {
            path: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21',
            linkPresent: true,
          },
          reapedPgids: [],
        }),
      ).toThrow(/Required/u);
    });
  });
});
