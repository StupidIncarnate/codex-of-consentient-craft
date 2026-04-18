import { GuildIdStub, GuildStub, QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { DesignStartResponderProxy } from './design-start-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const DESIGN_START_ALLOWED_STATUSES: readonly StatusKey[] = ['approved', 'design_approved'];

const DESIGN_START_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(DESIGN_START_ALLOWED_STATUSES);

const DESIGN_START_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !DESIGN_START_ALLOWED_SET.has(status),
);

describe('DesignStartResponder', () => {
  describe('allowed statuses with needsDesign true', () => {
    it.each(DESIGN_START_ALLOWED_STATUSES)(
      'VALID: {status: %s, needsDesign: true} => returns 200',
      async (status) => {
        const proxy = DesignStartResponderProxy();
        const questId = QuestIdStub();
        const guildId = GuildIdStub();
        const quest = QuestStub({ status: status as never, needsDesign: true });
        const guild = GuildStub({ id: guildId, path: '/home/user/project' as never });

        proxy.setupQuest({ quest });
        proxy.setupGuild({ guild });

        const result = await proxy.callResponder({
          params: { questId },
          body: { guildId },
        });

        expect(result.status).toBe(200);
      },
    );
  });

  describe('rejected statuses with needsDesign true', () => {
    it.each(DESIGN_START_REJECTED_STATUSES)(
      'INVALID: {status: %s, needsDesign: true} => returns 400',
      async (status) => {
        const proxy = DesignStartResponderProxy();
        const questId = QuestIdStub();
        const guildId = GuildIdStub();
        const quest = QuestStub({ status: status as never, needsDesign: true });

        proxy.setupQuest({ quest });

        const result = await proxy.callResponder({
          params: { questId },
          body: { guildId },
        });

        expect(result).toStrictEqual({
          status: 400,
          data: {
            error:
              'Quest must be in an approved status (approved or design_approved) with needsDesign=true to start design',
          },
        });
      },
    );
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      const proxy = DesignStartResponderProxy();

      const result = await proxy.callResponder({ params: null, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      const proxy = DesignStartResponderProxy();

      const result = await proxy.callResponder({ params: {}, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {missing guildId} => returns 400', async () => {
      const proxy = DesignStartResponderProxy();
      const questId = QuestIdStub();

      const result = await proxy.callResponder({
        params: { questId },
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID: {approved quest with needsDesign false} => returns 400 mentioning needsDesign', async () => {
      const proxy = DesignStartResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const quest = QuestStub({ status: 'approved' as never, needsDesign: false });

      proxy.setupQuest({ quest });

      const result = await proxy.callResponder({
        params: { questId },
        body: { guildId },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: {
          error:
            'Quest must be in an approved status (approved or design_approved) with needsDesign=true to start design',
        },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest fetch fails} => returns 500', async () => {
      const proxy = DesignStartResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      proxy.setupQuestError({ error: new Error('Quest fetch failed') });

      const result = await proxy.callResponder({
        params: { questId },
        body: { guildId },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest fetch failed' },
      });
    });
  });
});
