import { questOutboxLineContract } from './quest-outbox-line-contract';
import { QuestOutboxLineStub } from './quest-outbox-line.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts';

describe('questOutboxLineContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId, timestamp} => parses successfully', () => {
      const result = questOutboxLineContract.parse({
        questId: 'add-auth',
        timestamp: '2024-01-15T10:00:00.000Z',
      });

      expect(result).toStrictEqual({
        questId: 'add-auth',
        timestamp: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {different questId and timestamp} => parses successfully', () => {
      const result = questOutboxLineContract.parse({
        questId: 'fix-login-bug',
        timestamp: '2025-06-20T15:30:00.000Z',
      });

      expect(result).toStrictEqual({
        questId: 'fix-login-bug',
        timestamp: '2025-06-20T15:30:00.000Z',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_QUEST_ID: {questId: ""} => throws error', () => {
      expect(() =>
        questOutboxLineContract.parse({
          questId: '',
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_TIMESTAMP: {timestamp: "not-a-date"} => throws error', () => {
      expect(() =>
        questOutboxLineContract.parse({
          questId: 'add-auth',
          timestamp: 'not-a-date',
        }),
      ).toThrow(/Invalid datetime/u);
    });

    it('INVALID_TIMESTAMP: {timestamp: ""} => throws error', () => {
      expect(() =>
        questOutboxLineContract.parse({
          questId: 'add-auth',
          timestamp: '',
        }),
      ).toThrow(/Invalid datetime/u);
    });

    it('INVALID_MULTIPLE: {missing both fields} => throws error', () => {
      expect(() => questOutboxLineContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID_TYPE: {questId: number} => throws error', () => {
      expect(() =>
        questOutboxLineContract.parse({
          questId: 123,
          timestamp: '2024-01-15T10:00:00.000Z',
        }),
      ).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid quest outbox line', () => {
      const result = QuestOutboxLineStub();

      expect(result).toStrictEqual({
        questId: QuestIdStub().toString(),
        timestamp: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {custom questId} => creates with custom quest ID', () => {
      const result = QuestOutboxLineStub({ questId: 'custom-quest' as never });

      expect(result.questId).toBe('custom-quest');
    });

    it('VALID: {custom timestamp} => creates with custom timestamp', () => {
      const result = QuestOutboxLineStub({
        timestamp: '2025-12-25T00:00:00.000Z' as never,
      });

      expect(result.timestamp).toBe('2025-12-25T00:00:00.000Z');
    });
  });
});
