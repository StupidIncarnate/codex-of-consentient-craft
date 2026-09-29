import { stepStatics } from '../../statics/step/step-statics';

import { stepBatchPreflightTransformer } from './step-batch-preflight-transformer';

describe('stepBatchPreflightTransformer', () => {
  describe('an unknown step', () => {
    it('INVALID: {step: scroll} => names the typed value and lists every verb the contract knows', () => {
      const result = stepBatchPreflightTransformer({ steps: [{ step: 'scroll' }] });

      expect(result).toStrictEqual([
        `steps.0: Unknown step "scroll". Known steps: ${stepStatics.verbs.all.join(', ')}`,
      ]);
    });

    it('INVALID: {step: scroll, plus a stray key} => reports the step only, not its keys', () => {
      const result = stepBatchPreflightTransformer({ steps: [{ step: 'scroll', bogus: 1 }] });

      expect(result).toStrictEqual([
        `steps.0: Unknown step "scroll". Known steps: ${stepStatics.verbs.all.join(', ')}`,
      ]);
    });
  });

  describe('a stray key', () => {
    it('INVALID: {goto with bogus} => names the key and lists what goto takes', () => {
      const result = stepBatchPreflightTransformer({
        steps: [{ step: 'goto', path: '/', bogus: true }],
      });

      expect(result).toStrictEqual([
        'steps.0: goto has no key "bogus". It takes: path, node, expect',
      ]);
    });

    it('INVALID: {goto with two stray keys} => pluralises and names both', () => {
      const result = stepBatchPreflightTransformer({
        steps: [{ step: 'goto', path: '/', bogus: true, evil: 1 }],
      });

      expect(result).toStrictEqual([
        'steps.0: goto has no keys "bogus", "evil". It takes: path, node, expect',
      ]);
    });

    it('INVALID: {click with a value key} => lists the click keys', () => {
      const result = stepBatchPreflightTransformer({
        steps: [{ step: 'click', target: 'x', value: 'y' }],
      });

      expect(result).toStrictEqual([
        'steps.0: click has no key "value". It takes: target, within, ref, timeoutMs, node, expect',
      ]);
    });

    it('INVALID: {two steps, one bad each} => one line per step, indexed', () => {
      const result = stepBatchPreflightTransformer({
        steps: [{ step: 'goto', path: '/', bogus: true }, { step: 'scroll' }],
      });

      expect(result).toStrictEqual([
        'steps.0: goto has no key "bogus". It takes: path, node, expect',
        `steps.1: Unknown step "scroll". Known steps: ${stepStatics.verbs.all.join(', ')}`,
      ]);
    });
  });

  describe('a batch with nothing to refuse here', () => {
    it('VALID: {every verb with no stray key} => returns no refusals', () => {
      const result = stepBatchPreflightTransformer({
        steps: stepStatics.verbs.all.map((step) => ({ step })),
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {entry without a step} => leaves it to stepContract', () => {
      const result = stepBatchPreflightTransformer({ steps: [{ path: '/' }] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps is not an array} => leaves it to stepContract', () => {
      const result = stepBatchPreflightTransformer({ steps: 'goto' });

      expect(result).toStrictEqual([]);
    });
  });
});
