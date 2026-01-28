/**
 * PURPOSE: Main orchestrator widget for the CLI app managing screen state and navigation
 *
 * USAGE:
 * <CliAppWidget
 *   initialScreen="menu"
 *   onSpawnChaoswhisperer={({userInput}) => spawnAgent(userInput)}
 *   onRunQuest={({questId, questFolder}) => executeQuest(questId, questFolder)}
 *   onExit={() => process.exit(0)}
 * />
 * // Renders the appropriate screen based on state and handles navigation
 */
import React, { useState } from 'react';

import type {
  UserInput,
  InstallContext,
  Quest,
  QuestId,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import type { SignalQuestion } from '../../contracts/signal-question/signal-question-contract';
import type { SignalContext } from '../../contracts/signal-context/signal-context-contract';
import { AnswerScreenLayerWidget } from './answer-screen-layer-widget';
import { HelpScreenLayerWidget } from './help-screen-layer-widget';
import { InitScreenLayerWidget } from './init-screen-layer-widget';
import { ListScreenLayerWidget } from './list-screen-layer-widget';
import { AddScreenLayerWidget } from './add-screen-layer-widget';
import { MenuScreenLayerWidget } from './menu-screen-layer-widget';
import { RunScreenLayerWidget } from './run-screen-layer-widget';

type QuestFolder = Quest['folder'];

export type CliAppScreen = 'menu' | 'add' | 'help' | 'list' | 'init' | 'run' | 'answer';

export interface PendingQuestion {
  question: SignalQuestion;
  context: SignalContext;
  sessionId: SessionId;
}

export interface CliAppWidgetProps {
  initialScreen: CliAppScreen;
  onSpawnChaoswhisperer: ({ userInput }: { userInput: UserInput }) => void;
  onResumeChaoswhisperer: ({
    answer,
    sessionId,
  }: {
    answer: UserInput;
    sessionId: SessionId;
  }) => void;
  onRunQuest: ({ questId, questFolder }: { questId: QuestId; questFolder: QuestFolder }) => void;
  onExit: () => void;
  installContext: InstallContext;
  pendingQuestion?: PendingQuestion;
}

export const CliAppWidget = ({
  initialScreen,
  onSpawnChaoswhisperer,
  onResumeChaoswhisperer,
  onRunQuest,
  onExit,
  installContext,
  pendingQuestion,
}: CliAppWidgetProps): React.JSX.Element => {
  const [screen, setScreen] = useState<CliAppScreen>(initialScreen);

  if (screen === 'answer' && pendingQuestion !== undefined) {
    return (
      <AnswerScreenLayerWidget
        question={pendingQuestion.question}
        context={pendingQuestion.context}
        onSubmit={({ answer }) => {
          onResumeChaoswhisperer({ answer, sessionId: pendingQuestion.sessionId });
        }}
        onCancel={() => {
          setScreen('menu');
        }}
      />
    );
  }

  if (screen === 'help') {
    return (
      <HelpScreenLayerWidget
        onBack={() => {
          setScreen('menu');
        }}
      />
    );
  }

  if (screen === 'list') {
    return (
      <ListScreenLayerWidget
        startPath={installContext.targetProjectRoot}
        onBack={() => {
          setScreen('menu');
        }}
      />
    );
  }

  if (screen === 'init') {
    return (
      <InitScreenLayerWidget
        onBack={() => {
          setScreen('menu');
        }}
        installContext={installContext}
      />
    );
  }

  if (screen === 'add') {
    return (
      <AddScreenLayerWidget
        onSubmit={({ userInput }) => {
          onSpawnChaoswhisperer({ userInput });
        }}
        onCancel={() => {
          setScreen('menu');
        }}
      />
    );
  }

  if (screen === 'run') {
    return (
      <RunScreenLayerWidget
        startPath={installContext.targetProjectRoot}
        onRunQuest={({ questId, questFolder }) => {
          onRunQuest({ questId, questFolder });
        }}
        onBack={() => {
          setScreen('menu');
        }}
      />
    );
  }

  // Default: menu screen
  return (
    <MenuScreenLayerWidget
      onSelect={({ option }) => {
        setScreen(option as CliAppScreen);
      }}
      onExit={onExit}
    />
  );
};
