/**
 * PURPOSE: The `session-with-nested-subagent` recipe, executable — produces one session
 * transcript holding an outer sub-agent chain with one chain nested inside it, both finished, at
 * fidelity: direct (it writes JSONL files itself rather than building a `Plan`). Reach for this
 * over other recipes when testing sub-agent transcript nesting and replay parsing.
 *
 * Its one input, `guild`, is the guild id the transcript is filed under — an earlier recipe's
 * `guild.id`, passed explicitly, required because this recipe has no ancestor of its own to link
 * through.
 *
 * Returns one row, `session`, the same nested-row shape `session-single-turn` and
 * `session-with-nested-chain` key theirs (a `dmRegistryBroker.run` result is `{ <saveRecordAs
 * name>: {...fields} }`) — a caller composing seeds reaches every recipe's result through the same
 * three-segment `{binding.row.field}` form. `sessionId` matches the field name the session
 * ingredient's own record carries; `outer` and `nested` are this recipe's own addition, since a
 * direct-fidelity write has no ingredient route to carry them for it:
 * - `session.sessionId` — the session the outer chain was written as
 * - `session.outer` — the route that renders the outer sub-agent chain
 * - `session.nested` — the route that renders the chain nested inside it
 *
 * `copies:` the Claude CLI session transcript writer — its on-disk location is
 * `claudePathSlugEncoderTransformer` (the same transformer the server resolves a session through),
 * its line shapes are the stream-line contracts and stubs in `@dungeonmaster/shared/contracts`, and
 * the reader a drift shows up against is the orchestrator chat replay, which pairs a sub-agent file
 * to its Task by `toolUseResult.agentId`.
 *
 * USAGE:
 * await recipesSessionWithNestedSubagentBroker({ context, guild: '7306b468-…' });
 * // Writes the three JSONL files and returns { session: { sessionId, outer, nested } }
 */

import {
  absoluteFilePathContract,
  contentTextContract,
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  TaskToolResultStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import type { GuildId } from '@dungeonmaster/shared/contracts';
import { hydrationRunResultContract } from '@dungeonmaster/hydration/contracts';
import type { HydrationRunResult } from '@dungeonmaster/hydration/contracts';
import {
  claudePathSlugEncoderTransformer,
  streamLineToJsonLineTransformer,
} from '@dungeonmaster/shared/transformers';

import { fetchJson } from '#gateway/node/fetch';
import { writeFileCreatingParent } from '#gateway/node/fs__promises';
import { guildListingContract } from '../../../contracts/guild-listing/guild-listing-contract';
import type { RecipeContext } from '../../../contracts/recipe-context/recipe-context-contract';
import { recipeHttpStatics } from '../../../statics/recipe-http/recipe-http-statics';
import { seedFixtureStatics } from '../../../statics/seed-fixture/seed-fixture-statics';
import { transcriptTimestampTransformer } from '../../../transformers/transcript-timestamp/transcript-timestamp-transformer';

export const recipesSessionWithNestedSubagentBroker = async ({
  context,
  guild,
}: {
  context: RecipeContext;
  guild: GuildId;
}): Promise<HydrationRunResult> => {
  const guildsUrl = contentTextContract.parse(
    `${context.apiBaseUrl}${recipeHttpStatics.routes.guilds}`,
  );
  const listing = guildListingContract.parse({
    guilds: await fetchJson({
      url: guildsUrl,
      method: recipeHttpStatics.methods.get,
    }),
  });

  const owningGuild = listing.guilds.find((candidate) => candidate.id === guild);
  if (owningGuild === undefined) {
    throw new Error(
      `session-with-nested-subagent: no guild "${guild}" — the transcript has no path to be filed under. ${recipeHttpStatics.routes.guilds} knows: ${listing.guilds.map((candidate) => candidate.id).join(', ')}`,
    );
  }

  const { urlSlug } = owningGuild;
  if (urlSlug === undefined) {
    throw new Error(
      `session-with-nested-subagent: guild "${guild}" carries no urlSlug, so the session route this recipe returns cannot be built`,
    );
  }

  const fixture = seedFixtureStatics.session;

  const transcriptDir = claudePathSlugEncoderTransformer({
    homeDir: context.homePath,
    projectPath: absoluteFilePathContract.parse(owningGuild.path),
  });

  const mainLines = [
    streamLineToJsonLineTransformer({
      streamLine: {
        ...UserTextStringStreamLineStub({
          message: { role: 'user', content: fixture.userMessage },
        }),
        uuid: `${fixture.sessionId}-user`,
        timestamp: transcriptTimestampTransformer({
          offsetSeconds: fixture.offsetSeconds.userMessage,
        }),
      },
    }),
    streamLineToJsonLineTransformer({
      streamLine: {
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: fixture.outerToolUseId,
                name: 'Agent',
                input: {
                  description: fixture.outerDescription,
                  prompt: fixture.outerPrompt,
                  subagent_type: 'general-purpose',
                },
              },
            ],
          },
        }),
        uuid: `${fixture.sessionId}-task-outer`,
        timestamp: transcriptTimestampTransformer({
          offsetSeconds: fixture.offsetSeconds.outerLaunch,
        }),
      },
    }),
    streamLineToJsonLineTransformer({
      streamLine: {
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: fixture.outerToolUseId,
                content: fixture.completionText,
              },
            ],
          },
          toolUseResult: { agentId: fixture.outerAgentId },
        }),
        uuid: `${fixture.sessionId}-task-outer-result`,
        timestamp: transcriptTimestampTransformer({
          offsetSeconds: fixture.offsetSeconds.outerCompletion,
        }),
      },
    }),
  ];

  const outerLines = [
    streamLineToJsonLineTransformer({
      streamLine: {
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: fixture.outerText }],
            usage: {
              input_tokens: fixture.usage.inputTokens,
              output_tokens: fixture.usage.outputTokens,
            },
          },
        }),
        uuid: `${fixture.sessionId}-outer-text`,
        timestamp: transcriptTimestampTransformer({
          offsetSeconds: fixture.offsetSeconds.outerText,
        }),
      },
    }),
    streamLineToJsonLineTransformer({
      streamLine: {
        ...AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: fixture.nestedToolUseId,
                name: 'Agent',
                input: {
                  description: fixture.nestedDescription,
                  prompt: fixture.nestedPrompt,
                  subagent_type: 'general-purpose',
                },
              },
            ],
          },
        }),
        uuid: `${fixture.sessionId}-task-nested`,
        timestamp: transcriptTimestampTransformer({
          offsetSeconds: fixture.offsetSeconds.nestedLaunch,
        }),
      },
    }),
    streamLineToJsonLineTransformer({
      streamLine: {
        ...TaskToolResultStreamLineStub({
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: fixture.nestedToolUseId,
                content: fixture.completionText,
              },
            ],
          },
          toolUseResult: { agentId: fixture.nestedAgentId },
        }),
        uuid: `${fixture.sessionId}-task-nested-result`,
        timestamp: transcriptTimestampTransformer({
          offsetSeconds: fixture.offsetSeconds.nestedCompletion,
        }),
      },
    }),
  ];

  const nestedLines = [
    streamLineToJsonLineTransformer({
      streamLine: {
        ...AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: fixture.nestedText }],
            usage: {
              input_tokens: fixture.usage.inputTokens,
              output_tokens: fixture.usage.outputTokens,
            },
          },
        }),
        uuid: `${fixture.sessionId}-nested-text`,
        timestamp: transcriptTimestampTransformer({
          offsetSeconds: fixture.offsetSeconds.nestedText,
        }),
      },
    }),
  ];

  await writeFileCreatingParent(
    `${transcriptDir}/${fixture.sessionId}.jsonl`,
    `${mainLines.join('\n')}\n`,
  );
  await writeFileCreatingParent(
    `${transcriptDir}/${fixture.sessionId}/subagents/agent-${fixture.outerAgentId}.jsonl`,
    `${outerLines.join('\n')}\n`,
  );
  await writeFileCreatingParent(
    `${transcriptDir}/${fixture.sessionId}/subagents/agent-${fixture.nestedAgentId}.jsonl`,
    `${nestedLines.join('\n')}\n`,
  );

  const sessionRoute = `/${urlSlug}/session/${fixture.sessionId}`;

  return hydrationRunResultContract.parse({
    session: {
      sessionId: fixture.sessionId,
      outer: sessionRoute,
      nested: sessionRoute,
    },
  });
};
