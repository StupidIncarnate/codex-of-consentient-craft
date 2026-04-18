import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  questStatusMetadataContract,
  type QuestStatusMetadata,
} from './quest-status-metadata-contract';
import { DisplayHeaderStub } from '../display-header/display-header.stub';

export const QuestStatusMetadataStub = ({
  ...props
}: StubArgument<QuestStatusMetadata> = {}): QuestStatusMetadata =>
  questStatusMetadataContract.parse({
    isPreExecution: false,
    isPathseekerRunning: false,
    isAnyAgentRunning: false,
    isActivelyExecuting: false,
    isUserPaused: false,
    isQuestBlocked: false,
    isTerminal: false,
    isPauseable: false,
    isResumable: false,
    isStartable: false,
    isRecoverable: false,
    isAutoResumable: false,
    isGateApproved: false,
    isDesignPhase: false,
    shouldRenderExecutionPanel: false,
    nextApprovalStatus: null,
    displayHeader: DisplayHeaderStub({ value: 'QUEST CREATED' }),
    ...props,
  });
