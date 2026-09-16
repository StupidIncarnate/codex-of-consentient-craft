import { ResultKindStub } from '@dungeonmaster/siegelense/contracts';

import { siegelenseResultsInputContract } from './siegelense-results-input-contract';
import { SiegelenseResultsInputStub } from './siegelense-results-input.stub';

describe('siegelenseResultsInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {instanceId} => parses with every optional field absent', () => {
      expect(siegelenseResultsInputContract.parse(SiegelenseResultsInputStub())).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
      });
    });

    it('VALID: {instanceId, kind} => carries the narrowing kind through', () => {
      const result = siegelenseResultsInputContract.parse(
        SiegelenseResultsInputStub({ kind: ResultKindStub({ value: 'network' }) }),
      );

      expect(result.kind).toBe('network');
    });

    it('VALID: {instanceId, since: boot} => carries since through with no runId required', () => {
      const result = siegelenseResultsInputContract.parse(
        SiegelenseResultsInputStub({ since: 'boot' as never }),
      );

      expect(result.since).toBe('boot');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing instanceId} => throws validation error', () => {
      expect(() => siegelenseResultsInputContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {instanceId: malformed} => throws validation error', () => {
      expect(() =>
        siegelenseResultsInputContract.parse({ instanceId: 'not-an-instance-id' }),
      ).toThrow(/Instance id must look like/u);
    });

    it('INVALID: {instance} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        siegelenseResultsInputContract.parse({
          instanceId: 'inst_7f3a9c21',
          instance: 'inst_7f3a9c21',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
