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
          'LINES     0',
          'API CALLS 0 (assistant records — one API response spans several transcript lines)',
          'START     (no timestamped record)',
          'MODELS    ',
          '',
          'TOKENS (this transcript only, excludes sub-agents)',
          '  input (uncached)  : 0',
          '  cache_read        : 0',
          '  cache_creation    : 0',
          '  output            : 0',
          '  of which thinking : 0',
          '  TOTAL context-in  : 0',
          '',
          'TOOL CALLS (0)',
          '',
          'TOOL RESULT BYTES 0',
          'SUBAGENTS 0',
        ].join('\n'),
      );
    });

    it('VALID: {argv: [buckets, target resolving to no transcript]} => routes to DigestRunResponder and returns the header row alone', () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-buckets-ghost' });

      const result = SessionForensicsFlow({ argv: ['buckets', target] });

      expect(String(result)).toBe(
        'WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS',
      );
    });

    it('VALID: {argv: [gaps, target resolving to no transcript]} => routes to DigestRunResponder and returns the all-zero render', () => {
      const target = SessionIdStub({ value: 'session-forensics-flow-gaps-ghost' });

      const result = SessionForensicsFlow({ argv: ['gaps', target] });

      expect(String(result)).toBe(
        [
          'GAPS >= 120s between assistant turns',
          'AT        GAP      LIVE SUB-AGENTS',
          '',
          'WALL CLOCK      0.0 min',
          'IN GAPS         0.0 min  (0.0%)',
          '  blocked on sub  0.0 min  (0.0%)',
          '  TRUE IDLE       0.0 min  (0.0%)',
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
          'bare-flow',
          '  track                    OWED  signed  confirmed  unconfirmable  UNSIGNED',
          '  codeweaverSignoff           0       0          0              0         0',
          '  flowriderSignoff            0       0          0              0         0',
          '  siegemasterSignoff          7       0          0              0         7',
          '',
          'NOT AUTHORITATIVE — get-qa-checklist({questId, operationItemId}) is the real denominator.',
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
