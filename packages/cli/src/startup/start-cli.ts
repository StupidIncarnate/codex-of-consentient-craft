#!/usr/bin/env node

/**
 * PURPOSE: CLI entry point with interactive Ink menu, ChaosWhisperer spawning, and quest execution
 *
 * USAGE:
 * await StartCli();
 * // Renders interactive menu, spawns ChaosWhisperer on 'add', executes quests on 'run'
 */

import { resolve } from 'path';
import { render } from 'ink';
import React from 'react';

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { questsFolderEnsureBroker } from '@dungeonmaster/shared/brokers';
import type {
  UserInput,
  InstallContext,
  Quest,
  QuestId,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';

import type { PendingQuestion } from '../widgets/cli-app/cli-app-widget';

import { fsRealpathAdapter } from '../adapters/fs/realpath/fs-realpath-adapter';

import { chaoswhispererSpawnStreamingBroker } from '../brokers/chaoswhisperer/spawn-streaming/chaoswhisperer-spawn-streaming-broker';
import { questExecuteBroker } from '../brokers/quest/execute/quest-execute-broker';
import { maxIterationsContract } from '../contracts/max-iterations/max-iterations-contract';
import { slotCountContract } from '../contracts/slot-count/slot-count-contract';
import { slotOperationsContract } from '../contracts/slot-operations/slot-operations-contract';
import type { SlotIndex } from '../contracts/slot-index/slot-index-contract';
import { slotIndexContract } from '../contracts/slot-index/slot-index-contract';
import type { AgentSlot } from '../contracts/agent-slot/agent-slot-contract';
import { timeoutMsContract } from '../contracts/timeout-ms/timeout-ms-contract';
import type { CliAppScreen } from '../widgets/cli-app/cli-app-widget';
import { CliAppWidget } from '../widgets/cli-app/cli-app-widget';

type QuestFolder = Quest['folder'];

// Default orchestration configuration
const DEFAULT_SLOT_COUNT = 3;
const DEFAULT_TIMEOUT_MS = 300000; // 5 minutes
const DEFAULT_MAX_SPIRIT_LOOP_ITERATIONS = 10;
const QUEST_FILE_NAME = 'quest.json';

// ANSI escape sequence to clear screen and move cursor to top-left
const CLEAR_SCREEN = '\x1b[2J\x1b[H';

export const StartCli = async ({
  initialScreen = 'menu' as CliAppScreen,
  pendingQuestion,
}: {
  initialScreen?: CliAppScreen;
  pendingQuestion?: PendingQuestion;
} = {}): Promise<void> => {
  // Clear screen before rendering ink UI
  process.stdout.write(CLEAR_SCREEN);

  // State object to capture results from Ink callbacks (object reference stays constant)
  const state: {
    pendingChaoswhisperer: UserInput | null;
    pendingChaoswhispererResume: { answer: UserInput; sessionId: SessionId } | null;
    pendingQuestExecution: { questId: QuestId; questFolder: QuestFolder } | null;
    shouldExit: boolean;
  } = {
    pendingChaoswhisperer: null,
    pendingChaoswhispererResume: null,
    pendingQuestExecution: null,
    shouldExit: false,
  };

  // Compute install context for init flow
  // dungeonmasterRoot is 4 levels up from startup/ (startup -> src -> cli -> packages -> root)
  const dungeonmasterRoot = filePathContract.parse(resolve(__dirname, '../../../..'));
  const targetProjectRoot = filePathContract.parse(process.cwd());
  const installContext: InstallContext = { dungeonmasterRoot, targetProjectRoot };

  // Conditionally build pendingQuestion prop to satisfy exactOptionalPropertyTypes
  const pendingQuestionProp = pendingQuestion === undefined ? {} : { pendingQuestion };

  // Render the Ink app
  const { unmount, waitUntilExit } = render(
    React.createElement(CliAppWidget, {
      initialScreen,
      installContext,
      ...pendingQuestionProp,
      onSpawnChaoswhisperer: ({ userInput }: { userInput: UserInput }) => {
        state.pendingChaoswhisperer = userInput;
        unmount();
      },
      onResumeChaoswhisperer: ({
        answer,
        sessionId,
      }: {
        answer: UserInput;
        sessionId: SessionId;
      }) => {
        state.pendingChaoswhispererResume = { answer, sessionId };
        unmount();
      },
      onRunQuest: ({ questId, questFolder }: { questId: QuestId; questFolder: QuestFolder }) => {
        state.pendingQuestExecution = { questId, questFolder };
        unmount();
      },
      onExit: () => {
        state.shouldExit = true;
        unmount();
      },
    }),
  );

  await waitUntilExit();

  // Exit if user requested
  if (state.shouldExit) {
    return;
  }

  // Handle quest execution if pending
  if (state.pendingQuestExecution !== null) {
    const { questFolder } = state.pendingQuestExecution;

    // Ensure quests folder exists and get path
    const { questsBasePath } = await questsFolderEnsureBroker({
      startPath: filePathContract.parse(process.cwd()),
    });

    // Construct the quest file path
    const questFilePath = pathJoinAdapter({
      paths: [questsBasePath, questFolder, QUEST_FILE_NAME],
    });

    // Create slot operations for state management
    const slots = new Map<SlotIndex, AgentSlot>();
    const slotOperations = slotOperationsContract.parse({
      getAvailableSlot: ({ slotCount }: { slotCount: number }) => {
        for (let i = 0; i < slotCount; i++) {
          const index = slotIndexContract.parse(i);
          if (!slots.has(index)) {
            return index;
          }
        }
        return undefined;
      },
      assignSlot: ({ slotIndex, agentSlot }: { slotIndex: SlotIndex; agentSlot: AgentSlot }) => {
        slots.set(slotIndex, agentSlot);
      },
      releaseSlot: ({ slotIndex }: { slotIndex: SlotIndex }) => slots.delete(slotIndex),
      getActiveSlots: () =>
        Array.from(slots.entries()).map(([slotIndex, agentSlot]) => ({
          slotIndex,
          agentSlot,
        })),
    });

    // Execute the quest pipeline
    const result = await questExecuteBroker({
      projectPath: absoluteFilePathContract.parse(process.cwd()),
      questFilePath,
      slotCount: slotCountContract.parse(DEFAULT_SLOT_COUNT),
      timeoutMs: timeoutMsContract.parse(DEFAULT_TIMEOUT_MS),
      slotOperations,
      maxSpiritLoopIterations: maxIterationsContract.parse(DEFAULT_MAX_SPIRIT_LOOP_ITERATIONS),
    });

    // Determine next screen based on result
    const nextScreen: CliAppScreen = result.completed ? 'list' : 'menu';
    return StartCli({ initialScreen: nextScreen });
  }

  // Handle ChaosWhisperer resume if user answered a question
  if (state.pendingChaoswhispererResume !== null) {
    const { answer, sessionId } = state.pendingChaoswhispererResume;

    const result = await chaoswhispererSpawnStreamingBroker({
      userInput: answer,
      resumeSessionId: sessionId,
    });

    // Handle signal from resumed session
    if (
      result.signal?.signal === 'needs-user-input' &&
      result.sessionId !== null &&
      result.signal.question !== undefined &&
      result.signal.context !== undefined
    ) {
      const newPendingQuestion: PendingQuestion = {
        question: result.signal.question,
        context: result.signal.context,
        sessionId: result.sessionId,
      };
      return StartCli({ initialScreen: 'answer', pendingQuestion: newPendingQuestion });
    }

    const nextScreen: CliAppScreen = result.signal?.signal === 'complete' ? 'list' : 'menu';
    return StartCli({ initialScreen: nextScreen });
  }

  // No ChaosWhisperer pending, restart at menu
  if (state.pendingChaoswhisperer === null) {
    return StartCli({ initialScreen: 'menu' });
  }

  // Handle ChaosWhisperer spawn using streaming broker
  const result = await chaoswhispererSpawnStreamingBroker({
    userInput: state.pendingChaoswhisperer,
  });

  // Handle needs-user-input signal
  if (
    result.signal?.signal === 'needs-user-input' &&
    result.sessionId !== null &&
    result.signal.question !== undefined &&
    result.signal.context !== undefined
  ) {
    const newPendingQuestion: PendingQuestion = {
      question: result.signal.question,
      context: result.signal.context,
      sessionId: result.sessionId,
    };
    return StartCli({ initialScreen: 'answer', pendingQuestion: newPendingQuestion });
  }

  // Determine next screen based on signal
  const nextScreen: CliAppScreen = result.signal?.signal === 'complete' ? 'list' : 'menu';

  // Continue application loop with next screen
  return StartCli({ initialScreen: nextScreen });
};

const isMain =
  process.argv[1] !== undefined &&
  fsRealpathAdapter({ filePath: absoluteFilePathContract.parse(process.argv[1]) }) ===
    fsRealpathAdapter({ filePath: absoluteFilePathContract.parse(__filename) });

if (isMain) {
  StartCli().catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${errorMessage}\n`);
    process.exit(1);
  });
}
