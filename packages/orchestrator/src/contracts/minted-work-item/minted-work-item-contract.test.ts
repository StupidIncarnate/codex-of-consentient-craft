import { mintedWorkItemContract } from './minted-work-item-contract';
import { MintedWorkItemStub } from './minted-work-item.stub';

describe('mintedWorkItemContract', () => {
  describe('a plan-batch mint', () => {
    it('VALID: {step, role, assignedUnitIds, pieceId, payload} => round-trips every field', () => {
      const minted = MintedWorkItemStub({
        step: 'work',
        role: 'flowrider',
        assignedUnitIds: ['send-flow:terminal:batch-sent'],
        pieceId: 'pc-badge',
        payload: { specPath: './packages/web/src/flows/send/send-batch.e2e.ts' },
      });

      expect(minted).toStrictEqual({
        step: 'work',
        role: 'flowrider',
        assignedUnitIds: ['send-flow:terminal:batch-sent'],
        pieceId: 'pc-badge',
        payload: { specPath: './packages/web/src/flows/send/send-batch.e2e.ts' },
        needsLane: false,
      });
    });
  });

  describe('defaults', () => {
    it('EMPTY: {only step and role} => assignedUnitIds is [] and needsLane is false', () => {
      const minted = mintedWorkItemContract.parse({ step: 'plan', role: 'codeweaver' });

      expect(minted).toStrictEqual({
        step: 'plan',
        role: 'codeweaver',
        assignedUnitIds: [],
        needsLane: false,
      });
    });
  });

  describe('a mark-minted item', () => {
    it('VALID: {no pieceId, mintedBy set} => keeps the return edge and omits the piece', () => {
      const minted = MintedWorkItemStub({
        step: 'fixHappy',
        role: 'siegemaster',
        assignedUnitIds: ['send-flow:off-map:perf'],
        mintedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        needsLane: true,
      });

      expect(minted).toStrictEqual({
        step: 'fixHappy',
        role: 'siegemaster',
        assignedUnitIds: ['send-flow:off-map:perf'],
        mintedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        needsLane: true,
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {role: "not-a-role"} => throws, because the role table is closed', () => {
      expect(() => MintedWorkItemStub({ role: 'not-a-role' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {mintedBy: "not-a-uuid"} => throws, because the return edge names a work item', () => {
      expect(() => MintedWorkItemStub({ mintedBy: 'not-a-uuid' as never })).toThrow(/uuid/u);
    });
  });
});
