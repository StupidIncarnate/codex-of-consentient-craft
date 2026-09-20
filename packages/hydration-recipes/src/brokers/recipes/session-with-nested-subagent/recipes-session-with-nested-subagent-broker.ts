/**
 * PURPOSE: The `session-with-nested-subagent` recipe, executable — produces one session
 * transcript holding an outer sub-agent chain with one chain nested inside it, both finished, at
 * fidelity: direct. Reach for this over other recipes when testing sub-agent transcript nesting
 * and replay parsing.
 *
 * USAGE:
 * await recipesSessionWithNestedSubagentBroker({ context, guild: '7306b468-…' });
 * // Writes the three JSONL files and returns { sessionId, 'sessions.outer', 'sessions.nested' }
 */

import {
  absoluteFilePathContract,
  contentTextContract,
  fileContentsContract,
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  TaskToolResultStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import type { GuildId } from '@dungeonmaster/shared/contracts';
import {
  claudePathSlugEncoderTransformer,
  streamLineToJsonLineTransformer,
} from '@dungeonmaster/shared/transformers';

import { fetchJsonAdapter } from '../../../adapters/fetch/json/fetch-json-adapter';
import { fsWriteTextAdapter } from '../../../adapters/fs/write-text/fs-write-text-adapter';
import { guildListingContract } from '../../../contracts/guild-listing/guild-listing-contract';
import type { RecipeContext } from '../../../contracts/recipe-context/recipe-context-contract';
import { recipeResultContract } from '../../../contracts/recipe-result/recipe-result-contract';
import type { RecipeResult } from '../../../contracts/recipe-result/recipe-result-contract';
import { recipeHttpStatics } from '../../../statics/recipe-http/recipe-http-statics';
import { seedFixtureStatics } from '../../../statics/seed-fixture/seed-fixture-statics';
import { transcriptTimestampTransformer } from '../../../transformers/transcript-timestamp/transcript-timestamp-transformer';

export const recipesSessionWithNestedSubagentBroker = async ({
  context,
  guild,
}: {
  context: RecipeContext;
  guild: GuildId;
}): Promise<RecipeResult> => {
  const guildsUrl = contentTextContract.parse(
    `${context.apiBaseUrl}${recipeHttpStatics.routes.guilds}`,
  );
  const listing = guildListingContract.parse({
    guilds: await fetchJsonAdapter({
      url: guildsUrl,
      method: contentTextContract.parse(recipeHttpStatics.methods.get),
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

  await fsWriteTextAdapter({
    filePath: absoluteFilePathContract.parse(`${transcriptDir}/${fixture.sessionId}.jsonl`),
    contents: fileContentsContract.parse(`${mainLines.join('\n')}\n`),
  });
  await fsWriteTextAdapter({
    filePath: absoluteFilePathContract.parse(
      `${transcriptDir}/${fixture.sessionId}/subagents/agent-${fixture.outerAgentId}.jsonl`,
    ),
    contents: fileContentsContract.parse(`${outerLines.join('\n')}\n`),
  });
  await fsWriteTextAdapter({
    filePath: absoluteFilePathContract.parse(
      `${transcriptDir}/${fixture.sessionId}/subagents/agent-${fixture.nestedAgentId}.jsonl`,
    ),
    contents: fileContentsContract.parse(`${nestedLines.join('\n')}\n`),
  });

  const sessionRoute = `/${urlSlug}/session/${fixture.sessionId}`;

  return recipeResultContract.parse({
    sessionId: fixture.sessionId,
    'sessions.outer': sessionRoute,
    'sessions.nested': sessionRoute,
  });
};
