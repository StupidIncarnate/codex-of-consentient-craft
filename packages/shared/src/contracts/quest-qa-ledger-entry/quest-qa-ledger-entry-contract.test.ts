import { questQaLedgerEntryContract } from './quest-qa-ledger-entry-contract';
import { QuestQaLedgerEntryStub } from './quest-qa-ledger-entry.stub';

describe('questQaLedgerEntryContract', () => {
  describe('walked disposition', () => {
    it('VALID: {walked with a measured value and a falsifier} => parses the complete entry', () => {
      expect(QuestQaLedgerEntryStub()).toStrictEqual({
        itemId: 'view-persisted-comments:observable:check-badge-count-text',
        disposition: 'walked',
        evidence: 'COMMENT_COUNT_BADGE rendered the string "2"',
        brokenWouldShow:
          'would read "1" if the badge counted the node rather than the assertion card',
        observedBy: 'walker slice 3',
        rippleSites: [],
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('fixed disposition', () => {
    it('VALID: {fixed with ripple sites} => retains every checked site', () => {
      expect(
        QuestQaLedgerEntryStub({
          disposition: 'fixed',
          evidence: 'panel painted 512px against a 400px container before the fix, 400px after',
          rippleSites: [
            'packages/web/src/widgets/flow-node-detail-panel/flow-node-detail-panel-widget.tsx',
            'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
          ],
        }).rippleSites,
      ).toStrictEqual([
        'packages/web/src/widgets/flow-node-detail-panel/flow-node-detail-panel-widget.tsx',
        'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
      ]);
    });

    it('VALID: {rippleSites omitted} => defaults to an empty list', () => {
      expect(
        questQaLedgerEntryContract.parse({
          itemId: 'a-flow:observable:check-one',
          disposition: 'fixed',
          evidence: 'read 3, expected 2',
          observedBy: 'operator',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          createdAt: '2024-01-15T10:00:00.000Z',
        }).rippleSites,
      ).toStrictEqual([]);
    });
  });

  describe('dispositions that clear the gate without a measurement', () => {
    it('VALID: {gap with a reason} => parses, because an unreachable unit is an honest answer', () => {
      expect(
        QuestQaLedgerEntryStub({
          disposition: 'gap',
          evidence: 'no browser bridge is reachable from this session, so the DOM cannot be read',
        }).disposition,
      ).toBe('gap');
    });

    it('VALID: {recorded with a named owner} => parses', () => {
      expect(
        QuestQaLedgerEntryStub({
          disposition: 'recorded',
          evidence: 'fault injection needs a hook the repo does not ship',
          owner: 'follow-up quest: comment-batch fault injection',
        }).owner,
      ).toBe('follow-up quest: comment-batch fault injection');
    });

    it('VALID: {routed} => parses', () => {
      expect(
        QuestQaLedgerEntryStub({
          disposition: 'routed',
          evidence: 'asked the user whether a stale anchor should notify per box or once per batch',
        }).disposition,
      ).toBe('routed');
    });

    it('VALID: {unconfirmed} => parses', () => {
      expect(
        QuestQaLedgerEntryStub({
          disposition: 'unconfirmed',
          evidence: 'degraded run: no browser attached, every ui-state observable unverified',
        }).disposition,
      ).toBe('unconfirmed');
    });
  });

  describe('evidence is mandatory on every disposition', () => {
    it('EMPTY: {evidence: ""} => throws, so no unit can be dispositioned with nothing behind it', () => {
      expect(() => QuestQaLedgerEntryStub({ evidence: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {evidence missing entirely} => throws', () => {
      expect(() =>
        questQaLedgerEntryContract.parse({
          itemId: 'a-flow:observable:check-one',
          disposition: 'walked',
          observedBy: 'operator',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          createdAt: '2024-01-15T10:00:00.000Z',
        }),
      ).toThrow(/Required/u);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {disposition: "pending"} => throws, because un-dispositioned means no entry exists', () => {
      expect(() => QuestQaLedgerEntryStub({ disposition: 'pending' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {itemId not three segments} => throws', () => {
      expect(() => QuestQaLedgerEntryStub({ itemId: 'a-flow:observable' as never })).toThrow(
        /Invalid/u,
      );
    });

    it('INVALID: {workItemId not a uuid} => throws', () => {
      expect(() => QuestQaLedgerEntryStub({ workItemId: 'work-item-1' as never })).toThrow(
        /Invalid/u,
      );
    });

    it('INVALID: {createdAt not a datetime} => throws', () => {
      expect(() => QuestQaLedgerEntryStub({ createdAt: '2024-01-15' as never })).toThrow(
        /Invalid/u,
      );
    });
  });
});
