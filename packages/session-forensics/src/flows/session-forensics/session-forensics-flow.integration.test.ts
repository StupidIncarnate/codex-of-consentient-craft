import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { SessionIdStub, QuestIdStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { SessionForensicsFlow } from './session-forensics-flow';

const USAGE_BLOCK_TEXT = [
  'usage: session-forensics <command> <target>',
  'summary',
  'buckets',
  'gaps',
  'coverage',
].join('\n');

describe('SessionForensicsFlow', () => {
  describe('valid commands', () => {
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
          "  sign-off track         REQUIRED  signed  confirmed  can't confirm  NOT SIGNED",
          '  codeweaverSignoff             0       0          0              0           0',
          '  flowriderSignoff              0       0          0              0           0',
          '  siegemasterSignoff            7       0          0              0           7',
          '',
          'These counts can be too high.',
          'This reading has no operation item, so it counts rows a real checklist would leave out.',
          'For the exact numbers, ask get-qa-checklist({questId, operationItemId}).',
        ].join('\n'),
      );
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
