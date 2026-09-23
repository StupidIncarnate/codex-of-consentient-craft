import { instanceEvidenceListingContract } from './instance-evidence-listing-contract';
import { InstanceEvidenceListingStub } from './instance-evidence-listing.stub';

describe('instanceEvidenceListingContract', () => {
  describe('valid listings', () => {
    it('VALID: {the spec line 1180 block} => parses the complete populated listing', () => {
      const listing = InstanceEvidenceListingStub({
        dir: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c',
          linkPresent: true,
        },
        transcript: 'run_2.jsonl',
        logs: ['api-server.log', 'web-server.log'],
        lastShot: 'run_2/step7.png',
      });

      const result = instanceEvidenceListingContract.parse(listing);

      expect(result).toStrictEqual({
        dir: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c',
          linkPresent: true,
        },
        transcript: 'run_2.jsonl',
        logs: ['api-server.log', 'web-server.log'],
        lastShot: 'run_2/step7.png',
      });
    });

    it('VALID: {transcript: null, logs: [], lastShot: null} => an instance that never ran a step or took a shot', () => {
      const listing = InstanceEvidenceListingStub({
        dir: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c',
          linkPresent: true,
        },
        transcript: null,
        logs: [],
        lastShot: null,
      });

      const result = instanceEvidenceListingContract.parse(listing);

      expect(result).toStrictEqual({
        dir: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c',
          linkPresent: true,
        },
        transcript: null,
        logs: [],
        lastShot: null,
      });
    });
  });

  describe('invalid listings', () => {
    it('INVALID: {missing dir} => throws Required', () => {
      expect(() =>
        instanceEvidenceListingContract.parse({
          transcript: null,
          logs: [],
          lastShot: null,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing lastShot} => throws Required, because .nullable() is not .optional()', () => {
      expect(() =>
        instanceEvidenceListingContract.parse({
          dir: {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_9b2c',
            linkPresent: true,
          },
          transcript: null,
          logs: [],
        }),
      ).toThrow(/Required/u);
    });
  });
});
