import type { GuildStub } from '@dungeonmaster/shared/contracts';
import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildMidExecutionBroker } from '../guild-mid-execution/recipes-guild-mid-execution-broker';
import { recipesSessionSingleTurnBroker } from './recipes-session-single-turn-broker';
import type { SessionRecordStub } from '../../../contracts/session-record/session-record.stub';

type Guild = ReturnType<typeof GuildStub>;
type SessionRecord = ReturnType<typeof SessionRecordStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const SESSION_NAME = SavedRecordNameStub({ value: 'session' });

describe('recipesSessionSingleTurnBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and inputs', () => {
      expect({
        recipeName: recipesSessionSingleTurnBroker.recipeName,
        description: recipesSessionSingleTurnBroker.description,
        hasInputs: recipesSessionSingleTurnBroker.inputs !== undefined,
      }).toStrictEqual({
        recipeName: 'session-single-turn',
        description:
          'one session under an existing guild, holding a single turn prompt and response',
        hasInputs: true,
      });
    });
  });

  describe('stacked on a guild an earlier step made, against a real temporary directory', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {guildPath} => saves exactly session', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(recipesSessionSingleTurnBroker({ guildPath: guild.path }), target);

      expect(Object.keys(result).sort()).toStrictEqual(['session']);
    });

    it('VALID: {guildPath} => session is placed under the guild directory', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(recipesSessionSingleTurnBroker({ guildPath: guild.path }), target);
      const session = (result as Record<PropertyKey, unknown>)[SESSION_NAME] as SessionRecord;

      expect({ sessionId: session.sessionId, cwd: session.cwd }).toStrictEqual({
        sessionId: 'seed-session-1',
        cwd: guild.path,
      });
    });
  });
});
