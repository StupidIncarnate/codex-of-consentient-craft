import { siegelenseRunInputContract } from './siegelense-run-input-contract';
import { SiegelenseRunInputStub } from './siegelense-run-input.stub';

describe('siegelenseRunInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {instanceId, steps} => parses with stopOn defaulted to error', () => {
      expect(siegelenseRunInputContract.parse(SiegelenseRunInputStub())).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        steps: [
          {
            step: 'click',
            target: '[data-testid="GUILD_ADD"]',
            within: null,
            timeoutMs: null,
            node: null,
            expect: 'ok',
          },
        ],
        stopOn: 'error',
      });
    });

    it('VALID: {stopOn: never} => parses with the explicit stop policy, not the default', () => {
      const result = siegelenseRunInputContract.parse(SiegelenseRunInputStub({ stopOn: 'never' }));

      expect(result.stopOn).toBe('never');
    });

    it('VALID: {steps: two steps} => parses the whole batch in order', () => {
      const result = siegelenseRunInputContract.parse(
        SiegelenseRunInputStub({
          steps: [
            { step: 'goto', path: '/', node: null, expect: 'ok' },
            {
              step: 'click',
              target: '[data-testid="submit"]',
              within: null,
              timeoutMs: null,
              node: null,
              expect: 'ok',
            },
          ] as never,
        }),
      );

      expect(result.steps.map((step) => step.step)).toStrictEqual(['goto', 'click']);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing instanceId} => throws validation error', () => {
      expect(() => siegelenseRunInputContract.parse({ steps: [] })).toThrow(/Required/u);
    });

    it('INVALID: {instanceId: malformed} => throws validation error', () => {
      expect(() =>
        siegelenseRunInputContract.parse({ instanceId: 'not-an-instance-id', steps: [] }),
      ).toThrow(/Instance id must look like/u);
    });

    it('INVALID: {missing steps} => throws validation error', () => {
      expect(() => siegelenseRunInputContract.parse({ instanceId: 'inst_7f3a9c21' })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {step with an unrecognized verb} => throws validation error', () => {
      expect(() =>
        siegelenseRunInputContract.parse({
          instanceId: 'inst_7f3a9c21',
          steps: [{ step: 'dom' }],
        }),
      ).toThrow(/invalid/iu);
    });

    it('INVALID: {laneName} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        siegelenseRunInputContract.parse({
          instanceId: 'inst_7f3a9c21',
          steps: [],
          laneName: 'dungeonmaster-web',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
