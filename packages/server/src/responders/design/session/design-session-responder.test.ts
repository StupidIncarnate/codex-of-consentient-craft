import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { DesignSessionResponderProxy } from './design-session-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const DESIGN_SESSION_ALLOWED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isDesignPhase,
);

const DESIGN_SESSION_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(DESIGN_SESSION_ALLOWED_STATUSES);

const DESIGN_SESSION_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !DESIGN_SESSION_ALLOWED_SET.has(status),
);

const DESIGN_SESSION_REJECTED_ERROR =
  'Quest must be in a design-phase status (explore_design, review_design, or design_approved) to use the design chat';

describe('DesignSessionResponder', () => {
  describe('allowed statuses', () => {
    it.each(DESIGN_SESSION_ALLOWED_STATUSES)(
      'VALID: {status: %s} => returns 200 with chatProcessId',
      async (status) => {
        const proxy = DesignSessionResponderProxy();
        const chatProcessId = ProcessIdStub();
        const quest = QuestStub({ status: status as never });
        proxy.setupQuest({ quest });
        proxy.setupDesignChat({ chatProcessId });

        const result = await proxy.callResponder({
          params: { questId: QuestIdStub() },
          body: { guildId: GuildIdStub(), message: 'Update the button color' },
        });

        expect(result).toStrictEqual({
          status: 200,
          data: { chatProcessId },
        });
      },
    );
  });

  describe('rejected statuses', () => {
    it.each(DESIGN_SESSION_REJECTED_STATUSES)(
      'INVALID: {status: %s} => returns 400 with error',
      async (status) => {
        const proxy = DesignSessionResponderProxy();
        const quest = QuestStub({ status: status as never });
        proxy.setupQuest({ quest });

        const result = await proxy.callResponder({
          params: { questId: QuestIdStub() },
          body: { guildId: GuildIdStub(), message: 'Update the button color' },
        });

        expect(result).toStrictEqual({
          status: 400,
          data: { error: DESIGN_SESSION_REJECTED_ERROR },
        });
      },
    );
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({ params: null, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({ params: {}, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {missing guildId} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID: {missing message} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: { guildId: GuildIdStub() },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });

    it('INVALID: {empty message} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: { guildId: GuildIdStub(), message: '' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500', async () => {
      const proxy = DesignSessionResponderProxy();
      const quest = QuestStub({ status: 'explore_design' as never });
      proxy.setupQuest({ quest });
      proxy.setupDesignChatError({ error: new Error('Design chat failed') });

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: { guildId: GuildIdStub(), message: 'Update button' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Design chat failed' },
      });
    });
  });
});
