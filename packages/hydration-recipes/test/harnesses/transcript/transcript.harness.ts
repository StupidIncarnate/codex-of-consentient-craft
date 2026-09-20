/**
 * PURPOSE: Reads a written transcript out of a testbed and answers one COLUMN at a time — the
 * uuids, the completion agent ids, the assistant texts. Reach for this over reading the file in a
 * scenario: a scenario may hold no conditional, and `toolUseResult?.agentId ?? null` is one.
 *
 * `null` for a line that carries no completion, so the ARRAY shows WHERE each completion sits
 * rather than only how many there are — which is the whole difference between a nested chain and
 * two sibling ones. The testbed arrives per CALL rather than at construction, because a harness is
 * created at describe scope and a testbed inside the test that owns it.
 *
 * USAGE:
 * const transcripts = transcriptHarness();
 * transcripts.completionAgentIdsIn({ testbed, relativePath: 'projects/x/sess.jsonl' });
 */

import { FileContentsStub } from '@dungeonmaster/shared/contracts';
import { RelativePathStub } from '@dungeonmaster/testing';
import type { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { transcriptLinesReadTransformer } from '../../../src/transformers/transcript-lines-read/transcript-lines-read-transformer';

export const transcriptHarness = (): {
  uuidsIn: (params: {
    testbed: ReturnType<typeof installTestbedCreateBroker>;
    relativePath: string;
  }) => readonly unknown[];
  completionAgentIdsIn: (params: {
    testbed: ReturnType<typeof installTestbedCreateBroker>;
    relativePath: string;
  }) => readonly unknown[];
  assistantTextsIn: (params: {
    testbed: ReturnType<typeof installTestbedCreateBroker>;
    relativePath: string;
  }) => readonly unknown[];
  contentsOf: (params: {
    testbed: ReturnType<typeof installTestbedCreateBroker>;
    relativePath: string;
  }) => ReturnType<ReturnType<typeof installTestbedCreateBroker>['readFile']>;
} => ({
  uuidsIn: ({
    testbed,
    relativePath,
  }: {
    testbed: ReturnType<typeof installTestbedCreateBroker>;
    relativePath: string;
  }): readonly unknown[] =>
    transcriptLinesReadTransformer({
      contents: FileContentsStub({
        value: testbed.readFile({ relativePath: RelativePathStub({ value: relativePath }) }) ?? '',
      }),
    }).map((line) => line.uuid),

  completionAgentIdsIn: ({
    testbed,
    relativePath,
  }: {
    testbed: ReturnType<typeof installTestbedCreateBroker>;
    relativePath: string;
  }): readonly unknown[] =>
    transcriptLinesReadTransformer({
      contents: FileContentsStub({
        value: testbed.readFile({ relativePath: RelativePathStub({ value: relativePath }) }) ?? '',
      }),
    }).map((line) => line.toolUseResult?.agentId ?? null),

  assistantTextsIn: ({
    testbed,
    relativePath,
  }: {
    testbed: ReturnType<typeof installTestbedCreateBroker>;
    relativePath: string;
  }): readonly unknown[] =>
    transcriptLinesReadTransformer({
      contents: FileContentsStub({
        value: testbed.readFile({ relativePath: RelativePathStub({ value: relativePath }) }) ?? '',
      }),
    }).flatMap((line): readonly unknown[] =>
      typeof line.message.content === 'string'
        ? [line.message.content]
        : line.message.content.map((item) => item.text ?? null),
    ),

  contentsOf: ({
    testbed,
    relativePath,
  }: {
    testbed: ReturnType<typeof installTestbedCreateBroker>;
    relativePath: string;
  }): ReturnType<ReturnType<typeof installTestbedCreateBroker>['readFile']> =>
    testbed.readFile({ relativePath: RelativePathStub({ value: relativePath }) }),
});
