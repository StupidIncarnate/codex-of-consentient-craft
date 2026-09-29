import { instanceEvidenceListingContract } from './instance-evidence-listing-contract';
import { InstanceEvidenceListingStub } from './instance-evidence-listing.stub';

describe('instanceEvidenceListingContract', () => {
  describe('valid listings', () => {
    it('VALID: {dir, a log, a shot and a video} => parses every file as an absolute path with its size', () => {
      const listing = InstanceEvidenceListingStub({
        dir: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c',
          linkPresent: true,
        },
        files: [
          {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/api-server.log',
            bytes: 2048,
          },
          {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/runs/run_1/step1.png',
            bytes: 51234,
          },
          {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/video/a1.webm',
            bytes: 860132,
          },
        ],
      });

      const result = instanceEvidenceListingContract.parse(listing);

      expect(result).toStrictEqual({
        dir: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c',
          linkPresent: true,
        },
        files: [
          {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/api-server.log',
            bytes: 2048,
          },
          {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/runs/run_1/step1.png',
            bytes: 51234,
          },
          {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c/video/a1.webm',
            bytes: 860132,
          },
        ],
      });
    });

    it('EMPTY: {files: []} => an evidence directory holding nothing', () => {
      const result = instanceEvidenceListingContract.parse(
        InstanceEvidenceListingStub({
          dir: { path: '/home/user/.dungeonmaster/siegelense/inst_9b2c', linkPresent: false },
          files: [],
        }),
      );

      expect(result).toStrictEqual({
        dir: { path: '/home/user/.dungeonmaster/siegelense/inst_9b2c', linkPresent: false },
        files: [],
      });
    });
  });

  describe('invalid listings', () => {
    it('INVALID: {missing dir} => throws Required', () => {
      expect(() => instanceEvidenceListingContract.parse({ files: [] })).toThrow(/Required/u);
    });

    it('INVALID: {missing files} => throws Required', () => {
      expect(() =>
        instanceEvidenceListingContract.parse({
          dir: {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c',
            linkPresent: true,
          },
        }),
      ).toThrow(/Required/u);
    });
  });
});
