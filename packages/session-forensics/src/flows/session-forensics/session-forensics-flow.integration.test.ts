import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { AgentIdStub } from '@dungeonmaster/shared/contracts/agent-id/agent-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';
import { OperationItemStub } from '@dungeonmaster/shared/contracts/operation-item/operation-item.stub';
import { WardResultStub } from '@dungeonmaster/shared/contracts/ward-result/ward-result.stub';

import { SessionForensicsFlow } from './session-forensics-flow';
import { TranscriptRecordStub } from '../../contracts/transcript-record/transcript-record.stub';
import { claudeTranscriptHarness } from '../../../test/harnesses/claude-transcript/claude-transcript.harness';
import { chdir, cwd } from '#gateway/node/process';
import { join } from '#gateway/node/path';

const USAGE_BLOCK_TEXT = [
  'usage: session-forensics <command> <target>',
  'summary',
  'buckets',
  'gaps',
  'coverage',
  'quest',
  'buckets --minutes <n>',
  'gaps --floor-seconds <n>',
].join('\n');

describe('SessionForensicsFlow', () => {
  describe('valid commands', () => {
    const harness = claudeTranscriptHarness();

    it('VALID: {argv: [summary, target resolving to no transcript]} => routes to DigestRunResponder and returns the no-transcript render', async () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-summary-ghost' });

      const result = await SessionForensicsFlow({ argv: ['summary', target] });

      expect(result).toBe(
        [
          'Lines in the transcript  0',
          'Times the model replied  0 (one reply covers several lines of the transcript)',
          'Session started          (nothing in the file was timestamped)',
          'Models used              ',
          '',
          'Tokens for this session only. Sub-agents are counted separately.',
          'Cache reads and cache writes are priced differently, so they are counted on separate lines.',
          '  Fed in, not cached       : 0',
          '  Fed in, read from cache  : 0',
          '  Fed in, written to cache : 0',
          '  Written out by the model : 0',
          '  Of that output, thinking : 0',
          '  Total fed into the model : 0',
          '',
          'Tool calls the model made (0 in total)',
          '',
          'Bytes returned by tools  0',
          'Sub-agents started       0',
        ].join('\n'),
      );
    });

    it('VALID: {argv: [buckets, target resolving to no transcript]} => routes to DigestRunResponder and returns the header row alone', async () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-buckets-ghost' });

      const result = await SessionForensicsFlow({ argv: ['buckets', target] });

      expect(result).toBe(
        'Window (UTC)        Replies  Tool calls   Tokens out     Tokens in  Bytes from tools  Busiest tools',
      );
    });

    it('VALID: {argv: [gaps, target resolving to no transcript]} => routes to DigestRunResponder and returns the all-zero render', async () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-gaps-ghost' });

      const result = await SessionForensicsFlow({ argv: ['gaps', target] });

      expect(result).toBe(
        [
          'Gaps of 120 seconds or more between one model reply and the next.',
          'A gap that names sub-agents is time the session spent waiting on a helper.',
          'A gap marked *** NOTHING RUNNING *** had nothing happening at all.',
          'Minutes in  Gap      Sub-agents running',
          '',
          'Ran for                 0.0 minutes',
          'Spent in gaps           0.0 minutes  (0.0%)',
          '  waiting on a sub-agent  0.0 minutes  (0.0%)',
          '  nothing running at all  0.0 minutes  (0.0%)',
        ].join('\n'),
      );
    });

    it('VALID: {argv: [coverage, target]} => routes to DigestRunResponder and renders the real quest.json on disk', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'session-forensics-flow-coverage',
      });
      const questId = QuestIdStub({ value: 'flow-coverage-quest' });
      const flow = FlowStub({ id: 'bare-flow', flowType: 'runtime', nodes: [], edges: [] });

      testbed.writeFile({
        relativePath: '.dungeonmaster.json',
        content: '{}',
      });
      testbed.writeFile({
        relativePath: `.dungeonmaster/guilds/test-guild/quests/${questId}/quest.json`,
        content: JSON.stringify({ flows: [flow] }),
      });

      const originalCwd = cwd();
      chdir(testbed.guildPath);

      const result = await SessionForensicsFlow({ argv: ['coverage', questId] });

      chdir(originalCwd);
      testbed.cleanup();

      expect(result).toBe(
        [
          'Flow bare-flow',
          "  sign-off track         REQUIRED  marked        met     can't meet    unmet    unmarked",
          '  codeweaver                    0       0          0              0        0           0',
          '  flowrider                     0       0          0              0        0           0',
          '  siegemaster                   7       0          0              0        0           7',
          '',
          'These counts can be too high.',
          'This reading has no operation item, so it counts rows a real checklist would leave out.',
          'For the exact numbers, ask get-quest-work({questId, operationItemId}).',
        ].join('\n'),
      );
    });

    it('VALID: {argv: [quest, questId]} => routes to DigestRunResponder, joining the real quest.json to a real transcript and sub-agent', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'session-forensics-flow-quest',
      });
      const questId = QuestIdStub({ value: 'flow-quest-command-quest' });
      const target = SessionIdStub({ value: 'session-flow-quest-command' });
      const content = JSON.stringify(TranscriptRecordStub());
      await harness.writeSession({
        sessionId: target,
        content,
        subagentIds: [AgentIdStub({ value: 'agent-flow-quest-one' })],
      });

      const operation = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        text: 'core: notification adapter',
        flowIds: ['notify-flow'],
        packageNames: ['core'],
      });
      const wardResult = WardResultStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exitCode: 0,
        wardMode: 'full',
      });
      const workItem = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'complete',
        sessionId: target,
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:05:00.000Z',
        relatedDataItems: [
          'operations/a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          'wardResults/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        ],
      });

      testbed.writeFile({
        relativePath: '.dungeonmaster.json',
        content: '{}',
      });
      testbed.writeFile({
        relativePath: `.dungeonmaster/guilds/test-guild/quests/${questId}/quest.json`,
        content: JSON.stringify({
          userRequest: 'Add real-time notifications',
          workItems: [workItem],
          operations: [operation],
          wardResults: [wardResult],
        }),
      });

      const originalCwd = cwd();
      chdir(testbed.guildPath);

      const result = await SessionForensicsFlow({ argv: ['quest', questId] });

      chdir(originalCwd);
      testbed.cleanup();

      expect(result).toBe(
        [
          'User request: Add real-time notifications',
          '',
          [
            'Work item 1 — codeweaver (complete)',
            '  Work item id            f47ac10b-58cc-4372-a567-0e02b2c3d479',
            `  Session id              ${target}`,
            '  Wall clock              5.0 minutes',
            '  Operation               core: notification adapter',
            '  Flows                   notify-flow',
            '  Packages                core',
            `  Transcript size         ${content.length.toLocaleString('en-US')} bytes`,
            '  Sub-agents              1',
            '  Ward/riftcarver         ward exit 0 (full)',
          ].join('\n'),
        ].join('\n'),
      );
    });

    it('VALID: {argv: [coverage, target]} invoked from package subdirectory => walks up to repo root and renders', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'session-forensics-flow-subpath',
      });
      const questId = QuestIdStub({ value: 'flow-subpath-quest' });
      const flow = FlowStub({ id: 'bare-flow', flowType: 'runtime', nodes: [], edges: [] });

      testbed.writeFile({
        relativePath: '.dungeonmaster.json',
        content: '{}',
      });
      testbed.writeFile({
        relativePath: `.dungeonmaster/guilds/test-guild/quests/${questId}/quest.json`,
        content: JSON.stringify({ flows: [flow] }),
      });
      testbed.writeFile({
        relativePath: 'packages/some-package/dummy.txt',
        content: '',
      });

      const originalCwd = cwd();
      chdir(join(testbed.guildPath, 'packages/some-package'));

      const result = await SessionForensicsFlow({ argv: ['coverage', questId] });

      chdir(originalCwd);
      testbed.cleanup();

      expect(result).toBe(
        [
          'Flow bare-flow',
          "  sign-off track         REQUIRED  marked        met     can't meet    unmet    unmarked",
          '  codeweaver                    0       0          0              0        0           0',
          '  flowrider                     0       0          0              0        0           0',
          '  siegemaster                   7       0          0              0        0           7',
          '',
          'These counts can be too high.',
          'This reading has no operation item, so it counts rows a real checklist would leave out.',
          'For the exact numbers, ask get-quest-work({questId, operationItemId}).',
        ].join('\n'),
      );
    });

    it('EDGE: {argv: [coverage, unknown-quest]} => returns "quest not found"', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'session-forensics-flow-coverage-missing',
      });
      testbed.writeFile({
        relativePath: '.dungeonmaster.json',
        content: '{}',
      });
      const questId = QuestIdStub({ value: 'non-existent-quest' });

      const originalCwd = cwd();
      chdir(testbed.guildPath);

      const result = await SessionForensicsFlow({ argv: ['coverage', questId] });

      chdir(originalCwd);
      testbed.cleanup();

      expect(result).toBe('quest not found');
    });

    it('EDGE: {argv: [quest, unknown-quest]} => returns "quest not found"', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'session-forensics-flow-quest-missing',
      });
      testbed.writeFile({
        relativePath: '.dungeonmaster.json',
        content: '{}',
      });
      const questId = QuestIdStub({ value: 'non-existent-quest' });

      const originalCwd = cwd();
      chdir(testbed.guildPath);

      const result = await SessionForensicsFlow({ argv: ['quest', questId] });

      chdir(originalCwd);
      testbed.cleanup();

      expect(result).toBe('quest not found');
    });
  });

  describe('CLI flags', () => {
    const harness = claudeTranscriptHarness();

    it('VALID: {argv: [buckets, target, --minutes, 5]} => a 10-minute gap between real records splits into two 5-minute buckets', async () => {
      const target = SessionIdStub({ value: 'session-flow-buckets-minutes-flag' });
      const content = [
        JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })),
        JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:10:00.000Z' })),
      ].join('\n');
      await harness.writeSession({ sessionId: target, content });

      const result = await SessionForensicsFlow({ argv: ['buckets', target, '--minutes', '5'] });

      expect(result).toBe(
        [
          'Window (UTC)        Replies  Tool calls   Tokens out     Tokens in  Bytes from tools  Busiest tools',
          '19:00-19:05               1           0            0             0                 0  ',
          '19:10-19:15               1           0            0             0                 0  ',
        ].join('\n'),
      );
    });

    it('VALID: {argv: [gaps, target, --floor-seconds, 30]} => a 90-second gap between real records clears the lower floor and is listed', async () => {
      const target = SessionIdStub({ value: 'session-flow-gaps-floor-flag' });
      const content = [
        JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })),
        JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:01:30.000Z' })),
      ].join('\n');
      await harness.writeSession({ sessionId: target, content });

      const result = await SessionForensicsFlow({
        argv: ['gaps', target, '--floor-seconds', '30'],
      });

      expect(result).toBe(
        [
          'Gaps of 30 seconds or more between one model reply and the next.',
          'A gap that names sub-agents is time the session spent waiting on a helper.',
          'A gap marked *** NOTHING RUNNING *** had nothing happening at all.',
          'Minutes in  Gap      Sub-agents running',
          '0.0m 90s  *** NOTHING RUNNING ***',
          '',
          'Ran for                 1.5 minutes',
          'Spent in gaps           1.5 minutes  (100.0%)',
          '  waiting on a sub-agent  0.0 minutes  (0.0%)',
          '  nothing running at all  1.5 minutes  (100.0%)',
        ].join('\n'),
      );
    });

    it('INVALID: {argv: [buckets, target, --minutes, abc]} => a non-numeric flag value returns the usage block', async () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-buckets-bad-minutes' });

      const result = await SessionForensicsFlow({ argv: ['buckets', target, '--minutes', 'abc'] });

      expect(result).toBe(USAGE_BLOCK_TEXT);
    });

    it('INVALID: {argv: [gaps, target, --floor-seconds, -5]} => a negative flag value returns the usage block', async () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-gaps-bad-floor' });

      const result = await SessionForensicsFlow({
        argv: ['gaps', target, '--floor-seconds', '-5'],
      });

      expect(result).toBe(USAGE_BLOCK_TEXT);
    });

    it('INVALID: {argv: [buckets, target, --minutes]} => flag with no value returns the usage block', async () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-buckets-missing-minutes' });

      const result = await SessionForensicsFlow({ argv: ['buckets', target, '--minutes'] });

      expect(result).toBe(USAGE_BLOCK_TEXT);
    });

    it('INVALID: {argv: [gaps, target, --floor-seconds]} => flag with no value returns the usage block', async () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-gaps-missing-floor' });

      const result = await SessionForensicsFlow({
        argv: ['gaps', target, '--floor-seconds'],
      });

      expect(result).toBe(USAGE_BLOCK_TEXT);
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {argv: []} => returns the usage block', async () => {
      const result = await SessionForensicsFlow({ argv: [] });

      expect(result).toBe(USAGE_BLOCK_TEXT);
    });

    it('INVALID: {argv: [unknown-command, target]} => returns the usage block', async () => {
      const result = await SessionForensicsFlow({ argv: ['unknown-command', 'some-target'] });

      expect(result).toBe(USAGE_BLOCK_TEXT);
    });

    it('EMPTY: {argv: [summary]} with no target => returns the usage block', async () => {
      const result = await SessionForensicsFlow({ argv: ['summary'] });

      expect(result).toBe(USAGE_BLOCK_TEXT);
    });

    it('EMPTY: {argv: [summary, ""]} with empty-string target => returns the usage block', async () => {
      const result = await SessionForensicsFlow({ argv: ['summary', ''] });

      expect(result).toBe(USAGE_BLOCK_TEXT);
    });
  });
});
