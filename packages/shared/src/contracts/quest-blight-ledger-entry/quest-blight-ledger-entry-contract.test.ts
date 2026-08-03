import { questBlightLedgerEntryContract } from './quest-blight-ledger-entry-contract';
import { QuestBlightLedgerEntryStub } from './quest-blight-ledger-entry.stub';

describe('questBlightLedgerEntryContract', () => {
  describe('reviewed disposition', () => {
    it('VALID: {reviewed with observed evidence} => parses the complete entry', () => {
      expect(QuestBlightLedgerEntryStub()).toStrictEqual({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage',
        disposition: 'reviewed',
        evidence:
          'every branch in handleSubmit has a test: success, validation error, network error',
        observedBy: 'blightwarden',
        rippleSites: [],
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('fixed disposition', () => {
    it('VALID: {fixed with ripple sites} => retains every checked site', () => {
      expect(
        QuestBlightLedgerEntryStub({
          disposition: 'fixed',
          evidence: 'catch block swallowed the write error; now rethrows with the file path',
          rippleSites: [
            'packages/orchestrator/src/brokers/quest/save/quest-save-broker.ts',
            'packages/server/src/responders/quest/update/quest-update-responder.ts',
          ],
        }).rippleSites,
      ).toStrictEqual([
        'packages/orchestrator/src/brokers/quest/save/quest-save-broker.ts',
        'packages/server/src/responders/quest/update/quest-update-responder.ts',
      ]);
    });

    it('VALID: {rippleSites omitted} => defaults to an empty list', () => {
      expect(
        questBlightLedgerEntryContract.parse({
          itemId: 'packages/shared/src/index.ts:dead-code',
          disposition: 'fixed',
          evidence: 'removed the orphaned export, nothing imported it',
          observedBy: 'blightwarden',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          createdAt: '2024-01-15T10:00:00.000Z',
        }).rippleSites,
      ).toStrictEqual([]);
    });
  });

  describe('dispositions that clear the gate without a fix', () => {
    it('VALID: {gap with a reason} => parses, because a concern unreachable at this layer is an honest answer', () => {
      expect(
        QuestBlightLedgerEntryStub({
          disposition: 'gap',
          evidence:
            'perf cannot be assessed without a production traffic sample this session lacks',
        }).disposition,
      ).toBe('gap');
    });

    it('VALID: {recorded with a named owner} => parses', () => {
      expect(
        QuestBlightLedgerEntryStub({
          disposition: 'recorded',
          evidence:
            'N+1 query in the batch loader needs a follow-up quest to fix without regressing tests',
          owner: 'follow-up quest: batch loader N+1',
        }).owner,
      ).toBe('follow-up quest: batch loader N+1');
    });

    it('VALID: {routed} => parses', () => {
      expect(
        QuestBlightLedgerEntryStub({
          disposition: 'routed',
          evidence:
            'asked the user whether the duplicated validator should be extracted or left inline',
        }).disposition,
      ).toBe('routed');
    });
  });

  describe('evidence is mandatory on every disposition', () => {
    it('EMPTY: {evidence: ""} => throws, so no unit can be dispositioned with nothing behind it', () => {
      expect(() => QuestBlightLedgerEntryStub({ evidence: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {evidence missing entirely} => throws', () => {
      expect(() =>
        questBlightLedgerEntryContract.parse({
          itemId: 'packages/shared/src/index.ts:craft',
          disposition: 'reviewed',
          observedBy: 'blightwarden',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          createdAt: '2024-01-15T10:00:00.000Z',
        }),
      ).toThrow(/Required/u);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {disposition: "pending"} => throws, because a unit with no entry has no disposition at all', () => {
      expect(() => QuestBlightLedgerEntryStub({ disposition: 'pending' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {itemId empty} => throws', () => {
      expect(() => QuestBlightLedgerEntryStub({ itemId: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {workItemId not a uuid} => throws', () => {
      expect(() => QuestBlightLedgerEntryStub({ workItemId: 'work-item-1' as never })).toThrow(
        /Invalid/u,
      );
    });

    it('INVALID: {createdAt not a datetime} => throws', () => {
      expect(() => QuestBlightLedgerEntryStub({ createdAt: '2024-01-15' as never })).toThrow(
        /Invalid/u,
      );
    });
  });
});
