import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts/saved-record-name/saved-record-name.stub';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { guildQueryRouteBroker } from '../../guild/query-route/guild-query-route-broker';
import { dmRegistryBroker } from './dm-registry-broker';
import { recipesGuildEmptyBroker } from '../../recipes/guild-empty/recipes-guild-empty-broker';
import { recipesSessionSingleTurnBroker } from '../../recipes/session-single-turn/recipes-session-single-turn-broker';
import { recipesSessionWithNestedChainBroker } from '../../recipes/session-with-nested-chain/recipes-session-with-nested-chain-broker';
import type { SessionRecordStub } from '../../../contracts/session-record/session-record.stub';
import { SessionWithNestedChainInputsStub } from '../../../contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs.stub';

type Guild = ReturnType<typeof GuildStub>;
type SessionRecord = ReturnType<typeof SessionRecordStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const SESSION_NAME = SavedRecordNameStub({ value: 'session' });
const NESTED_NAME = SavedRecordNameStub({ value: 'nested' });

// DEF-78: every recipe's own `add()` starts its own `defaults(index)` at index 0, so seeding two
// guild recipes (or two session recipes) into ONE target used to mint the identical literal path
// or id for both, and the second write either 500'd on a duplicate guild path or silently
// overwrote the first session's transcript. `guildUniquePathResolveBroker` and
// `sessionUniqueIdResolveBroker` are what make this real composition — the shape
// `get-testing-patterns`' own "Recipes and Ingredients" standard now asks agents to write — work.
describe('dmRegistryBroker — composing recipes against one target (DEF-78, integration — real disk)', () => {
  const fileTarget = fileTargetHarness();

  it('VALID: {guild-empty x2, session-single-turn, session-with-nested-chain} => two distinct guilds and two distinct sessions', async () => {
    const target = fileTarget.target();

    const firstGuildResult = await run(recipesGuildEmptyBroker(), target);
    const secondGuildResult = await run(recipesGuildEmptyBroker(), target);
    const firstGuild = (firstGuildResult as Record<PropertyKey, unknown>)[GUILD_NAME] as Guild;
    const secondGuild = (secondGuildResult as Record<PropertyKey, unknown>)[GUILD_NAME] as Guild;

    const singleTurnResult = await run(
      recipesSessionSingleTurnBroker(SessionWithNestedChainInputsStub({ guildPath: firstGuild.path })),
      target,
    );
    const nestedChainResult = await run(
      recipesSessionWithNestedChainBroker(SessionWithNestedChainInputsStub({ guildPath: firstGuild.path })),
      target,
    );
    const singleTurnSession = (singleTurnResult as Record<PropertyKey, unknown>)[
      SESSION_NAME
    ] as SessionRecord;
    const nestedChainSession = (nestedChainResult as Record<PropertyKey, unknown>)[
      NESTED_NAME
    ] as SessionRecord;

    expect({
      guildPaths: [firstGuild.path, secondGuild.path],
      sessionIds: [singleTurnSession.sessionId, nestedChainSession.sessionId],
    }).toStrictEqual({
      guildPaths: [
        `${target.home}/guilds-under-test/guild-1`,
        `${target.home}/guilds-under-test/guild-2`,
      ],
      sessionIds: ['seed-session-1', 'seed-session-2'],
    });

    const guilds = await guildQueryRouteBroker({ target, where: {} });

    expect(
      guilds
        .map((guild) => ({ path: guild.path, valid: guild.valid }))
        .sort((a, b) => a.path.localeCompare(b.path)),
    ).toStrictEqual([
      { path: `${target.home}/guilds-under-test/guild-1`, valid: true },
      { path: `${target.home}/guilds-under-test/guild-2`, valid: true },
    ]);
  });
});
