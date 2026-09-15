import { shotListingContract } from './shot-listing-contract';
import { ShotListingStub } from './shot-listing.stub';

describe('shotListingContract', () => {
  describe('valid listings', () => {
    it('VALID: {open: true, why: start} => parses the complete listing with no pixelChange or blank field', () => {
      const result = shotListingContract.parse({
        step: 1,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
        open: true,
        why: 'start',
        node: null,
      });

      expect(result).toStrictEqual({
        step: 1,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
        open: true,
        why: 'start',
        node: null,
      });
    });

    it('VALID: {open: false, why: null} => a captured-but-unopened shot parses', () => {
      const result = shotListingContract.parse({
        step: 3,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step3.png',
        open: false,
        why: null,
        node: null,
      });

      expect(result).toStrictEqual({
        step: 3,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step3.png',
        open: false,
        why: null,
        node: null,
      });
    });

    it('VALID: {open: false, node: a label} => an unopened shot still names the node it reached', () => {
      const result = shotListingContract.parse({
        step: 4,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step4.png',
        open: false,
        why: null,
        node: 'chain-rendered',
      });

      expect(result.node).toBe('chain-rendered');
    });

    it('VALID: {open: true, why: failed} => the step that ended the batch opens for the failure', () => {
      const result = shotListingContract.parse({
        step: 5,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step5.png',
        open: true,
        why: 'failed',
        node: null,
      });

      expect(result.why).toBe('failed');
    });

    it('VALID: {pixelChange, blank passed in} => the fields this chunk does not ship are stripped from the output', () => {
      const result = shotListingContract.parse({
        step: 1,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
        open: true,
        why: 'start',
        node: null,
        pixelChange: '38%',
        blank: false,
      } as never);

      expect(result).toStrictEqual({
        step: 1,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
        open: true,
        why: 'start',
        node: null,
      });
    });
  });

  describe('invalid listings', () => {
    it('INVALID: {missing open} => throws validation error', () => {
      expect(() =>
        shotListingContract.parse({
          step: 1,
          path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
          why: 'start',
          node: null,
        } as never),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates an open start shot with no node', () => {
      const result = ShotListingStub();

      expect(result).toStrictEqual({
        step: 1,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
        open: true,
        why: 'start',
        node: null,
      });
    });
  });
});
