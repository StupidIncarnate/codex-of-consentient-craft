import { shotListingContract } from './shot-listing-contract';
import { ShotListingStub } from './shot-listing.stub';

describe('shotListingContract', () => {
  describe('valid listings', () => {
    it('VALID: {open: true, why: start} => parses the complete listing with pixelChange, blank and blankColour', () => {
      const result = shotListingContract.parse({
        step: 1,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
        open: true,
        why: 'start',
        node: null,
        pixelChange: null,
        blank: false,
        blankColour: null,
      });

      expect(result).toStrictEqual({
        step: 1,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
        open: true,
        why: 'start',
        node: null,
        pixelChange: null,
        blank: false,
        blankColour: null,
      });
    });

    it('VALID: {open: false, why: null} => a captured-but-unopened shot parses', () => {
      const result = shotListingContract.parse({
        step: 3,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step3.png',
        open: false,
        why: null,
        node: null,
        pixelChange: '4%',
        blank: false,
        blankColour: null,
      });

      expect(result).toStrictEqual({
        step: 3,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step3.png',
        open: false,
        why: null,
        node: null,
        pixelChange: '4%',
        blank: false,
        blankColour: null,
      });
    });

    it('VALID: {open: false, node: a label} => an unopened shot still names the node it reached', () => {
      const result = shotListingContract.parse({
        step: 4,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step4.png',
        open: false,
        why: null,
        node: 'chain-rendered',
        pixelChange: '4%',
        blank: false,
        blankColour: null,
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
        pixelChange: '0%',
        blank: false,
        blankColour: null,
      });

      expect(result.why).toBe('failed');
    });

    it('VALID: {blank: true, blankColour: "#0d0907"} => a blank shot reports its colour', () => {
      const result = shotListingContract.parse({
        step: 5,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step5.png',
        open: true,
        why: 'blank',
        node: null,
        pixelChange: '0%',
        blank: true,
        blankColour: '#0d0907',
      });

      expect({ blank: result.blank, blankColour: result.blankColour }).toStrictEqual({
        blank: true,
        blankColour: '#0d0907',
      });
    });

    it('VALID: {pixelChange: null} => the first shot in an instance carries no predecessor', () => {
      const result = shotListingContract.parse({
        step: 1,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_1/step1.png',
        open: true,
        why: 'start',
        node: null,
        pixelChange: null,
        blank: false,
        blankColour: null,
      });

      expect(result.pixelChange).toBe(null);
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
          pixelChange: null,
          blank: false,
          blankColour: null,
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing pixelChange} => throws validation error', () => {
      expect(() =>
        shotListingContract.parse({
          step: 1,
          path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
          open: true,
          why: 'start',
          node: null,
          blank: false,
          blankColour: null,
        } as never),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates an open start shot with no node and a measured pixelChange', () => {
      const result = ShotListingStub();

      expect(result).toStrictEqual({
        step: 1,
        path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
        open: true,
        why: 'start',
        node: null,
        pixelChange: '38%',
        blank: false,
        blankColour: null,
      });
    });
  });
});
