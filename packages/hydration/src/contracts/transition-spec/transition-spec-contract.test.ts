import { transitionSpecContract } from './transition-spec-contract';
import type { ReachFn } from './transition-spec-contract';
import { TransitionSpecStub } from './transition-spec.stub';
import { HydrationTargetStub } from '../hydration-target/hydration-target.stub';
import { FieldValuesStub } from '../field-values/field-values.stub';

describe('transitionSpecContract', () => {
  describe('valid transition specs', () => {
    it('VALID: {field: "status", to: ["created", "approved"]} => returns both', () => {
      expect(TransitionSpecStub({ field: 'status', to: ['created', 'approved'] })).toStrictEqual({
        field: 'status',
        to: ['created', 'approved'],
      });
    });
  });

  describe('invalid transition specs', () => {
    it('INVALID: {field: "status", to: []} => throws "Array must contain at least 1 element(s)"', () => {
      expect(() => transitionSpecContract.parse({ field: 'status', to: [] })).toThrow(
        /Array must contain at least 1 element\(s\)/u,
      );
    });

    it('INVALID: {to: ["created"]} => throws "Required"', () => {
      expect(() => transitionSpecContract.parse({ to: ['created'] })).toThrow(/Required/u);
    });
  });

  describe('ReachFn', () => {
    it('VALID: {reach fn destructuring record} => the record it was handed travels through', () => {
      const target = HydrationTargetStub({ baseUrl: 'http://localhost:3737' });
      const record = FieldValuesStub({ status: 'created' });
      const reach: ReachFn<ReturnType<typeof HydrationTargetStub>, string> = (args) => ({
        from: args.from,
        to: args.to,
        target: args.target,
        record: args.record,
      });

      expect(reach({ from: 'created', to: 'in_progress', target, record })).toStrictEqual({
        from: 'created',
        to: 'in_progress',
        target,
        record,
      });
    });
  });
});
