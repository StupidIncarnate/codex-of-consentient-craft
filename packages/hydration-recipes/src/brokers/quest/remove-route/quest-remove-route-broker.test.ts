import { questRemoveRouteBroker } from './quest-remove-route-broker';
import { questRemoveRouteBrokerProxy } from './quest-remove-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';
import {
  isPreExecutionQuestStatusGuard,
  isTerminalQuestStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;
const ALL_STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const DELETABLE_STATUSES = ALL_STATUSES.filter(
  (status) =>
    isTerminalQuestStatusGuard({ status }) ||
    isUserPausedQuestStatusGuard({ status }) ||
    isPreExecutionQuestStatusGuard({ status }),
);

const NOT_DELETABLE_STATUSES = ALL_STATUSES.filter(
  (status) =>
    !isTerminalQuestStatusGuard({ status }) &&
    !isUserPausedQuestStatusGuard({ status }) &&
    !isPreExecutionQuestStatusGuard({ status }),
);

describe('questRemoveRouteBroker', () => {
  describe('a quest in a deletable status', () => {
    it.each(DELETABLE_STATUSES)(
      'VALID: {status: %s} => resolves its guild then deletes it',
      async (status) => {
        const proxy = questRemoveRouteBrokerProxy();
        const target = DmTargetStub({});
        const record = QuestStub({ id: 'add-auth', status });
        proxy.succeeds({ guild: GuildListItemStub({ id: GUILD_ID }), quest: record });

        const result = await questRemoveRouteBroker({ target, record });

        expect(result).toStrictEqual({ deleted: true });
      },
    );
  });

  describe('a quest that is actively executing', () => {
    it.each(NOT_DELETABLE_STATUSES)(
      'ERROR: {status: %s} => refuses, naming the quest and its status',
      async (status) => {
        questRemoveRouteBrokerProxy();
        const target = DmTargetStub({});
        const record = QuestStub({ id: 'add-auth', status });

        await expect(questRemoveRouteBroker({ target, record })).rejects.toThrow(
          new RegExp(
            `^questRemoveRouteBroker: quest "add-auth" is "${status}" and cannot be removed while it is actively executing — set its status to paused, a terminal status, or a pre-execution status first \\(e\\.g\\. \`q\\[0\\]\\.setRaw\\(\\{ status: 'paused' \\}\\)\`\\), then remove it\\.$`,
            'u',
          ),
        );
      },
    );
  });
});
