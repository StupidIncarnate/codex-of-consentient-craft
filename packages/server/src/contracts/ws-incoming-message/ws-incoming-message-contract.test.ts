import type { ZodError } from 'zod';
import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { wsIncomingMessageContract } from './ws-incoming-message-contract';
import {
  WsReplayHistoryMessageStub,
  WsWardDetailRequestMessageStub,
} from './ws-incoming-message.stub';

describe('wsIncomingMessageContract', () => {
  describe('valid inputs', () => {
    it('VALID: replay-history shape => parses successfully', () => {
      const result = WsReplayHistoryMessageStub();

      expect(result.type).toBe('replay-history');
    });

    it('VALID: ward-detail-request shape => parses successfully', () => {
      const result = WsWardDetailRequestMessageStub();

      expect(result.type).toBe('ward-detail-request');
    });

    it('VALID: quest-by-session-request shape => parses successfully', () => {
      const result = wsIncomingMessageContract.parse({
        type: 'quest-by-session-request',
        sessionId: 'sess-1',
        guildId: GuildIdStub(),
      });

      expect(result.type).toBe('quest-by-session-request');
    });

    it('VALID: subscribe-quest shape => parses successfully', () => {
      const result = wsIncomingMessageContract.parse({
        type: 'subscribe-quest',
        questId: QuestIdStub(),
      });

      expect(result.type).toBe('subscribe-quest');
    });

    it('VALID: unsubscribe-quest shape => parses successfully', () => {
      const result = wsIncomingMessageContract.parse({
        type: 'unsubscribe-quest',
        questId: QuestIdStub(),
      });

      expect(result.type).toBe('unsubscribe-quest');
    });

    it('VALID: replay-quest-history shape => parses successfully', () => {
      const result = wsIncomingMessageContract.parse({
        type: 'replay-quest-history',
        questId: QuestIdStub(),
      });

      expect(result.type).toBe('replay-quest-history');
    });
  });

  describe('invalid inputs', () => {
    it('ERROR: replay-history without sessionId => throws validation error', () => {
      expect(() => {
        wsIncomingMessageContract.parse({
          type: 'replay-history',
          guildId: GuildIdStub(),
          chatProcessId: 'proc-1',
        });
      }).toThrow(/Required/u);
    });

    it('ERROR: ward-detail-request without questId => throws validation error', () => {
      expect(() => {
        wsIncomingMessageContract.parse({
          type: 'ward-detail-request',
          wardResultId: 'ward-result-1',
        });
      }).toThrow(/Required/u);
    });

    it('ERROR: bogus type => throws validation error', () => {
      expect(() => {
        wsIncomingMessageContract.parse({
          type: 'bogus-type',
          questId: QuestIdStub(),
        });
      }).toThrow(/Invalid discriminator/u);
    });

    it('ERROR: subscribe-quest missing questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'subscribe-quest',
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: subscribe-quest with null questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'subscribe-quest',
        questId: null,
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: subscribe-quest with empty string questId => safeParse fails on min length', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'subscribe-quest',
        questId: '',
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('too_small');
    });

    it('ERROR: subscribe-quest with number questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'subscribe-quest',
        questId: 42,
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: subscribe-quest with object questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'subscribe-quest',
        questId: { id: 'nope' },
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: unsubscribe-quest missing questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'unsubscribe-quest',
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: unsubscribe-quest with null questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'unsubscribe-quest',
        questId: null,
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: unsubscribe-quest with empty string questId => safeParse fails on min length', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'unsubscribe-quest',
        questId: '',
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('too_small');
    });

    it('ERROR: unsubscribe-quest with number questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'unsubscribe-quest',
        questId: 7,
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: unsubscribe-quest with object questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'unsubscribe-quest',
        questId: { id: 'nope' },
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: replay-quest-history missing questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'replay-quest-history',
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: replay-quest-history with null questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'replay-quest-history',
        questId: null,
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: replay-quest-history with empty string questId => safeParse fails on min length', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'replay-quest-history',
        questId: '',
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('too_small');
    });

    it('ERROR: replay-quest-history with number questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'replay-quest-history',
        questId: 99,
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: replay-quest-history with object questId => safeParse fails on questId path', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'replay-quest-history',
        questId: { id: 'nope' },
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.path[0]).toBe('questId');
      expect(issue?.code).toBe('invalid_type');
    });

    it('ERROR: subscribe-quest type misspelled => safeParse fails with invalid discriminator', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'subscribe-quests',
        questId: QuestIdStub(),
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.code).toBe('invalid_union_discriminator');
    });

    it('ERROR: unsubscribe-quest type misspelled => safeParse fails with invalid discriminator', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'unsubscribe-quests',
        questId: QuestIdStub(),
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.code).toBe('invalid_union_discriminator');
    });

    it('ERROR: replay-quest-history type misspelled => safeParse fails with invalid discriminator', () => {
      const result = wsIncomingMessageContract.safeParse({
        type: 'replay-quest-histories',
        questId: QuestIdStub(),
      });
      const { error } = result as { success: false; error: ZodError };
      const [issue] = error.issues;

      expect(result.success).toBe(false);
      expect(issue?.code).toBe('invalid_union_discriminator');
    });
  });
});
