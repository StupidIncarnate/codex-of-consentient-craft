import { unitIdContract } from './unit-id-contract';
import { UnitIdStub } from './unit-id.stub';

describe('unitIdContract', () => {
  describe('valid three-segment ids', () => {
    it('VALID: {observable id} => parses', () => {
      expect(UnitIdStub({ value: 'send-flow:observable:obs-3' })).toBe(
        'send-flow:observable:obs-3',
      );
    });

    it('VALID: {terminal id} => parses', () => {
      expect(UnitIdStub({ value: 'send-flow:terminal:persist-failed' })).toBe(
        'send-flow:terminal:persist-failed',
      );
    });

    it('VALID: {branch id} => parses', () => {
      expect(UnitIdStub({ value: 'send-flow:branch:touches-flows-no' })).toBe(
        'send-flow:branch:touches-flows-no',
      );
    });

    it('VALID: {off-map id, the real flow-scoped hyphenated shape} => parses', () => {
      expect(UnitIdStub({ value: 'send-flow:off-map:hostile-input' })).toBe(
        'send-flow:off-map:hostile-input',
      );
    });

    it('EDGE: {single-character segments} => parses', () => {
      expect(UnitIdStub({ value: 'a:b:c' })).toBe('a:b:c');
    });

    it('EDGE: {digits after the leading letter} => parses', () => {
      expect(UnitIdStub({ value: 'flow2:observable:check-400-body' })).toBe(
        'flow2:observable:check-400-body',
      );
    });
  });

  describe('determinism', () => {
    it('VALID: {same source segments parsed twice} => yields byte-identical ids', () => {
      expect(unitIdContract.parse('send-flow:observable:obs-3')).toBe(
        unitIdContract.parse('send-flow:observable:obs-3'),
      );
    });
  });

  describe('invalid shapes', () => {
    it('INVALID: {two segments} => reports failure', () => {
      expect(unitIdContract.safeParse('send-flow:observable').success).toBe(false);
    });

    it('INVALID: {four segments} => throws', () => {
      expect(() => UnitIdStub({ value: 'a:b:c:d' })).toThrow(/Invalid/u);
    });

    it('INVALID: {empty middle segment} => throws', () => {
      expect(() => UnitIdStub({ value: 'send-flow::obs-3' })).toThrow(/Invalid/u);
    });

    it('INVALID: {uppercase segment} => throws', () => {
      expect(() => UnitIdStub({ value: 'sendFlow:observable:checkThing' })).toThrow(/Invalid/u);
    });

    it('INVALID: {segment starting with a digit} => throws', () => {
      expect(() => UnitIdStub({ value: '2flow:observable:check-thing' })).toThrow(/Invalid/u);
    });

    it('INVALID: {trailing hyphen} => throws', () => {
      expect(() => UnitIdStub({ value: 'send-flow:observable:check-' })).toThrow(/Invalid/u);
    });

    it('EMPTY: {empty string} => throws', () => {
      expect(() => UnitIdStub({ value: '' })).toThrow(/Invalid/u);
    });
  });
});
