import { subagentRosterRowContract } from './subagent-roster-row-contract';
import { SubagentRosterRowStub } from './subagent-roster-row.stub';
import { SubagentMetaStub } from '../subagent-meta/subagent-meta.stub';
import { TranscriptRecordStub } from '../transcript-record/transcript-record.stub';

describe('subagentRosterRowContract', () => {
  describe('valid input', () => {
    it('VALID: {agentId, meta, timestamps, turnCount, records} => returns the branded row', () => {
      const result = subagentRosterRowContract.parse({
        agentId: 'agent-xyz',
        meta: SubagentMetaStub(),
        startedAt: '2026-09-01T19:09:06.542Z',
        endedAt: '2026-09-01T19:12:00.000Z',
        turnCount: 5,
        records: [TranscriptRecordStub()],
      });

      expect(result).toStrictEqual(
        SubagentRosterRowStub({
          agentId: 'agent-xyz',
          startedAt: '2026-09-01T19:09:06.542Z',
          endedAt: '2026-09-01T19:12:00.000Z',
          turnCount: 5,
        }),
      );
    });
  });

  describe('absent timestamps', () => {
    it('EDGE: {startedAt and endedAt omitted} => returns the row with both keys absent', () => {
      const result = subagentRosterRowContract.parse({
        agentId: 'agent-no-window',
        meta: SubagentMetaStub(),
        turnCount: 0,
        records: [],
      });

      expect(result).toStrictEqual(
        subagentRosterRowContract.parse({
          agentId: 'agent-no-window',
          meta: SubagentMetaStub(),
          turnCount: 0,
          records: [],
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {turnCount: -1} => throws', () => {
      expect(() => SubagentRosterRowStub({ turnCount: -1 })).toThrow(
        /greater than or equal to 0|Number must be/u,
      );
    });

    it('INVALID: {agentId: ""} => throws on empty agent id', () => {
      expect(() => SubagentRosterRowStub({ agentId: '' })).toThrow(/too_small/u);
    });

    it('INVALID: {records: not an array} => throws', () => {
      expect(() => SubagentRosterRowStub({ records: 'nope' as never })).toThrow(/Expected array/u);
    });

    it('INVALID: {meta: missing required fields} => throws', () => {
      expect(() =>
        SubagentRosterRowStub({ meta: { agentType: 'general-purpose' } as never }),
      ).toThrow(/Required/u);
    });
  });

  describe('missing fields', () => {
    it('EMPTY: {no turnCount} => throws', () => {
      expect(() =>
        subagentRosterRowContract.parse({
          agentId: 'agent-abc',
          meta: SubagentMetaStub(),
          records: [],
        }),
      ).toThrow(/Required/u);
    });

    it('EMPTY: {no records} => throws', () => {
      expect(() =>
        subagentRosterRowContract.parse({
          agentId: 'agent-abc',
          meta: SubagentMetaStub(),
          turnCount: 0,
        }),
      ).toThrow(/Required/u);
    });
  });
});
