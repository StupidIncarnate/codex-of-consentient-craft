import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';
import { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQuestHarness } from '../../../test/harnesses/orchestration-quest/orchestration-quest.harness';
import { ClarificationAnswerStub } from '../../contracts/clarification-answer/clarification-answer.stub';
import { ClarificationQuestionStub } from '../../contracts/clarification-question/clarification-question.stub';

import { ClarifyAnswerFlow } from './clarify-answer-flow';

describe('ClarifyAnswerFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const questHelper = orchestrationQuestHarness();

  describe('export', () => {
    it('VALID: ClarifyAnswerFlow => exports an async function', () => {
      expect(ClarifyAnswerFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('resume prompt — real spawn against the fake Claude CLI, argv recorded', () => {
    it('VALID: {multi-select answer with labels and typed text, single-select answer} => the resumed session receives one line per answer', async () => {
      const testbed = installTestbedCreateBroker({ baseName: 'caf-two-question-set' });
      const home = envHarness.setupHome({ tempDir: testbed.guildPath });
      const cli = questHelper.configureFakeClaudeCli();
      const { guild, questId } = await questHelper.createGuildAndQuest({ testbed });
      const sessionId = SessionIdStub({ value: 'clarify-two-question-session' });

      await questHelper.seedFlowsAndComments({
        questId,
        flows: [],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
        comments: [],
      });

      await ClarifyAnswerFlow({
        guildId: guild.id,
        sessionId,
        questId,
        answers: [
          ClarificationAnswerStub({
            header: 'Letters',
            labels: ['Alpha', 'Gamma'],
            text: 'prefer Gamma',
          }),
          ClarificationAnswerStub({ header: 'Size', labels: ['Small'] }),
        ],
        questions: [
          ClarificationQuestionStub({
            header: 'Letters',
            multiSelect: true,
            options: [
              { label: 'Alpha', description: 'First letter' },
              { label: 'Beta', description: 'Second letter' },
              { label: 'Gamma', description: 'Third letter' },
            ],
          }),
          ClarificationQuestionStub({
            header: 'Size',
            multiSelect: false,
            options: [
              { label: 'Small', description: 'Fits in a pocket' },
              { label: 'Large', description: 'Needs a bag' },
            ],
          }),
        ],
      });

      const invocation = await questHelper.waitForClaudeInvocation({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: testbed.guildPath,
        timeoutMs: 8000,
      });

      cli.restore();
      home.restore();
      testbed.cleanup();

      expect(invocation).toStrictEqual({
        resumeSessionId: sessionId,
        prompt: 'Letters: Alpha, Gamma — prefer Gamma\nSize: Small',
      });
    }, 15000);

    it('VALID: {answer with no label checked, only typed text} => the resumed session receives the typed text as the line', async () => {
      const testbed = installTestbedCreateBroker({ baseName: 'caf-typed-only' });
      const home = envHarness.setupHome({ tempDir: testbed.guildPath });
      const cli = questHelper.configureFakeClaudeCli();
      const { guild, questId } = await questHelper.createGuildAndQuest({ testbed });
      const sessionId = SessionIdStub({ value: 'clarify-typed-only-session' });

      await questHelper.seedFlowsAndComments({
        questId,
        flows: [],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
        comments: [],
      });

      await ClarifyAnswerFlow({
        guildId: guild.id,
        sessionId,
        questId,
        answers: [
          ClarificationAnswerStub({ header: 'Letters', labels: [], text: 'my own answer' }),
        ],
        questions: [
          ClarificationQuestionStub({
            header: 'Letters',
            multiSelect: true,
            options: [
              { label: 'Alpha', description: 'First letter' },
              { label: 'Beta', description: 'Second letter' },
            ],
          }),
        ],
      });

      const invocation = await questHelper.waitForClaudeInvocation({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: testbed.guildPath,
        timeoutMs: 8000,
      });

      cli.restore();
      home.restore();
      testbed.cleanup();

      expect(invocation).toStrictEqual({
        resumeSessionId: sessionId,
        prompt: 'Letters: my own answer',
      });
    }, 15000);

    it('VALID: {single-select answer with typed text carrying a pasted image token} => the resumed session receives the token and the read-images trailer', async () => {
      const testbed = installTestbedCreateBroker({ baseName: 'caf-pasted-image' });
      const home = envHarness.setupHome({ tempDir: testbed.guildPath });
      const cli = questHelper.configureFakeClaudeCli();
      const { guild, questId } = await questHelper.createGuildAndQuest({ testbed });
      const sessionId = SessionIdStub({ value: 'clarify-pasted-image-session' });
      const imagePath = `${testbed.guildPath}/images/0b8f2c1e-5d3a-4f7e-9a21-6c4d8e1f3b57.png`;

      await questHelper.seedFlowsAndComments({
        questId,
        flows: [],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
        comments: [],
      });

      await ClarifyAnswerFlow({
        guildId: guild.id,
        sessionId,
        questId,
        answers: [
          ClarificationAnswerStub({
            header: 'Shape',
            labels: [],
            text: `like this ![Pasted Image 1](${imagePath})`,
          }),
        ],
        questions: [
          ClarificationQuestionStub({
            header: 'Shape',
            multiSelect: false,
            options: [
              { label: 'Round', description: 'Soft edges' },
              { label: 'Square', description: 'Hard edges' },
            ],
          }),
        ],
      });

      const invocation = await questHelper.waitForClaudeInvocation({
        claudeQueueDir: cli.claudeQueueDir,
        cwd: testbed.guildPath,
        timeoutMs: 8000,
      });

      cli.restore();
      home.restore();
      testbed.cleanup();

      expect(invocation).toStrictEqual({
        resumeSessionId: sessionId,
        prompt: `Shape: like this ![Pasted Image 1](${imagePath})\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`,
      });
    }, 15000);
  });
});
