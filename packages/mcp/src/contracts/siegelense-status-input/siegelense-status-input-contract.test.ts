import { InstanceIdStub } from '@dungeonmaster/siegelense/contracts';

import { siegelenseStatusInputContract } from './siegelense-status-input-contract';
import { SiegelenseStatusInputStub } from './siegelense-status-input.stub';

describe('siegelenseStatusInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {} => parses to the fleet form with instanceId absent', () => {
      expect(siegelenseStatusInputContract.parse(SiegelenseStatusInputStub())).toStrictEqual({});
    });

    it('VALID: {instanceId} => parses to the one-instance form', () => {
      const result = siegelenseStatusInputContract.parse(
        SiegelenseStatusInputStub({ instanceId: InstanceIdStub() }),
      );

      expect(result.instanceId).toBe('inst_7f3a9c21');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {instanceId: malformed} => throws validation error', () => {
      expect(() =>
        siegelenseStatusInputContract.parse({ instanceId: 'not-an-instance-id' }),
      ).toThrow(/Instance id must look like/u);
    });

    it('INVALID: {instance} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        siegelenseStatusInputContract.parse({ instance: 'inst_7f3a9c21' } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
