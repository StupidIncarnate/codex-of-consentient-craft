import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import {
  SessionIdStub,
  AgentIdStub,
  QuestIdStub,
  ContentTextStub,
  FlowStub,
  WorkItemStub,
  OperationItemStub,
  WardResultStub,
} from '@dungeonmaster/shared/contracts';

import { SessionForensicsFlow } from './session-forensics-flow';
import { TranscriptRecordStub } from '../../contracts/transcript-record/transcript-record.stub';
import { claudeTranscriptHarness } from '../../../test/harnesses/claude-transcript/claude-transcript.harness';

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

    it('VALID: {argv: [summary, target resolving to no transcript]} => routes to DigestRunResponder and returns the no-transcript render', () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-summary-ghost' });

      const result = SessionForensicsFlow({ argv: ['summary', target] });

      expect(String(result)).toBe(
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

    it('VALID: {argv: [buckets, target resolving to no transcript]} => routes to DigestRunResponder and returns the header row alone', () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-buckets-ghost' });

      const result = SessionForensicsFlow({ argv: ['buckets', target] });

      expect(String(result)).toBe(
        'Window (UTC)        Replies  Tool calls   Tokens out     Tokens in  Bytes from tools  Busiest tools',
      );
    });

    it('VALID: {argv: [gaps, target resolving to no transcript]} => routes to DigestRunResponder and returns the all-zero render', () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-gaps-ghost' });

      const result = SessionForensicsFlow({ argv: ['gaps', target] });

      expect(String(result)).toBe(
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

    it('VALID: {argv: [coverage, target]} => routes to DigestRunResponder and renders the real quest.json on disk', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'session-forensics-flow-coverage' }),
      });
      const questId = QuestIdStub({ value: 'flow-coverage-quest' });
      const flow = FlowStub({ id: 'bare-flow', flowType: 'runtime', nodes: [], edges: [] });

      testbed.writeFile({
        relativePath: RelativePathStub({
          value: `.dungeonmaster/guilds/test-guild/quests/${questId}/quest.json`,
        }),
        content: FileContentStub({ value: JSON.stringify({ flows: [flow] }) }),
      });

      const originalCwd = process.cwd();
      process.chdir(testbed.guildPath);

      const result = SessionForensicsFlow({ argv: ['coverage', questId] });

      process.chdir(originalCwd);
      testbed.cleanup();

      expect(String(result)).toBe(
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
        baseName: BaseNameStub({ value: 'session-forensics-flow-quest' }),
      });
      const questId = QuestIdStub({ value: 'flow-quest-command-quest' });
      const target = SessionIdStub({ value: 'session-flow-quest-command' });
      const content = ContentTextStub({ value: JSON.stringify(TranscriptRecordStub()) });
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
        relativePath: RelativePathStub({
          value: `.dungeonmaster/guilds/test-guild/quests/${questId}/quest.json`,
        }),
        content: FileContentStub({
          value: JSON.stringify({
            userRequest: 'Add real-time notifications',
            workItems: [workItem],
            operations: [operation],
            wardResults: [wardResult],
          }),
        }),
      });

      const originalCwd = process.cwd();
      process.chdir(testbed.guildPath);

      const result = SessionForensicsFlow({ argv: ['quest', questId] });

      process.chdir(originalCwd);
      testbed.cleanup();

      expect(String(result)).toBe(
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
  });

  describe('CLI flags', () => {
    const harness = claudeTranscriptHarness();

    it('VALID: {argv: [buckets, target, --minutes, 5]} => a 10-minute gap between real records splits into two 5-minute buckets', async () => {
      const target = SessionIdStub({ value: 'session-flow-buckets-minutes-flag' });
      const content = ContentTextStub({
        value: [
          JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })),
          JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:10:00.000Z' })),
        ].join('\n'),
      });
      await harness.writeSession({ sessionId: target, content });

      const result = SessionForensicsFlow({ argv: ['buckets', target, '--minutes', '5'] });

      expect(String(result)).toBe(
        [
          'Window (UTC)        Replies  Tool calls   Tokens out     Tokens in  Bytes from tools  Busiest tools',
          '19:00-19:05               1           0            0             0                 0  ',
          '19:10-19:15               1           0            0             0                 0  ',
        ].join('\n'),
      );
    });

    it('VALID: {argv: [gaps, target, --floor-seconds, 30]} => a 90-second gap between real records clears the lower floor and is listed', async () => {
      const target = SessionIdStub({ value: 'session-flow-gaps-floor-flag' });
      const content = ContentTextStub({
        value: [
          JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })),
          JSON.stringify(TranscriptRecordStub({ timestamp: '2026-09-01T19:01:30.000Z' })),
        ].join('\n'),
      });
      await harness.writeSession({ sessionId: target, content });

      const result = SessionForensicsFlow({ argv: ['gaps', target, '--floor-seconds', '30'] });

      expect(String(result)).toBe(
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

    it('INVALID: {argv: [buckets, target, --minutes, abc]} => a non-numeric flag value returns the usage block', () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-buckets-bad-minutes' });

      const result = SessionForensicsFlow({ argv: ['buckets', target, '--minutes', 'abc'] });

      expect(String(result)).toBe(USAGE_BLOCK_TEXT);
    });

    it('INVALID: {argv: [gaps, target, --floor-seconds, -5]} => a negative flag value returns the usage block', () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-gaps-bad-floor' });

      const result = SessionForensicsFlow({ argv: ['gaps', target, '--floor-seconds', '-5'] });

      expect(String(result)).toBe(USAGE_BLOCK_TEXT);
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {argv: []} => returns the usage block', () => {
      const result = SessionForensicsFlow({ argv: [] });

      expect(String(result)).toBe(USAGE_BLOCK_TEXT);
    });

    it('INVALID: {argv: [unknown-command, target]} => returns the usage block', () => {
      const result = SessionForensicsFlow({ argv: ['unknown-command', 'some-target'] });

      expect(String(result)).toBe(USAGE_BLOCK_TEXT);
    });

    it('EMPTY: {argv: [summary]} with no target => returns the usage block', () => {
      const result = SessionForensicsFlow({ argv: ['summary'] });

      expect(String(result)).toBe(USAGE_BLOCK_TEXT);
    });
  });
});
