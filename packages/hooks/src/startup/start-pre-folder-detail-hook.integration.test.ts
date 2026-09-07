import { FolderDetailHookDataStub } from '../contracts/folder-detail-hook-data/folder-detail-hook-data.stub';
import { folderDetailBlockMessageStatics } from '../statics/folder-detail-block-message/folder-detail-block-message-statics';

import { hookRunnerHarness } from '../../test/harnesses/hook-runner/hook-runner.harness';
import { transcriptHarness } from '../../test/harnesses/transcript/transcript.harness';

const BROKER_FILE = '/repo/packages/hooks/src/brokers/demo/demo-broker.ts';

const brokersCallLine = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'toolu_1',
        name: 'mcp__dungeonmaster__get-folder-detail',
        input: { folderType: 'brokers' },
      },
    ],
  },
});

const contractsCallLine = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'toolu_2',
        name: 'mcp__dungeonmaster__get-folder-detail',
        input: { folderType: 'contracts' },
      },
    ],
  },
});

const plainLine = JSON.stringify({
  type: 'assistant',
  message: { role: 'assistant', content: [{ type: 'text', text: 'Working on it.' }] },
});

const expectedBlockStderr = `${folderDetailBlockMessageStatics.header}\n\nCall get-folder-detail({ folderType: "brokers" }) now.\n\n${folderDetailBlockMessageStatics.rule}\n\n${folderDetailBlockMessageStatics.footer}\n`;

describe('pre-folder-detail-hook', () => {
  const runner = hookRunnerHarness();

  describe('blocked: folder type never loaded this session', () => {
    it('VALID: {Write into brokers, transcript records no call} => exit 2 naming the folder type', () => {
      const transcripts = transcriptHarness();
      const transcriptPath = transcripts.write({ contents: plainLine });

      const result = runner.runHook({
        hookName: 'start-pre-folder-detail-hook',
        hookData: FolderDetailHookDataStub({
          tool_input: { file_path: BROKER_FILE },
          transcript_path: transcriptPath,
        }),
      });

      transcripts.cleanup();

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expectedBlockStderr,
      });
    });

    it('VALID: {Write into brokers, transcript records only a contracts call} => exit 2', () => {
      const transcripts = transcriptHarness();
      const transcriptPath = transcripts.write({
        contents: contractsCallLine,
      });

      const result = runner.runHook({
        hookName: 'start-pre-folder-detail-hook',
        hookData: FolderDetailHookDataStub({
          tool_input: { file_path: BROKER_FILE },
          transcript_path: transcriptPath,
        }),
      });

      transcripts.cleanup();

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expectedBlockStderr,
      });
    });
  });

  describe('allowed', () => {
    it('VALID: {Write into brokers, transcript records the brokers call} => exit 0', () => {
      const transcripts = transcriptHarness();
      const transcriptPath = transcripts.write({
        contents: [plainLine, brokersCallLine].join('\n'),
      });

      const result = runner.runHook({
        hookName: 'start-pre-folder-detail-hook',
        hookData: FolderDetailHookDataStub({
          tool_input: { file_path: BROKER_FILE },
          transcript_path: transcriptPath,
        }),
      });

      transcripts.cleanup();

      expect(result).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
    });

    it('VALID: {Edit into brokers with no call recorded} => exit 0, only Write is gated', () => {
      const transcripts = transcriptHarness();
      const transcriptPath = transcripts.write({ contents: plainLine });

      const result = runner.runHook({
        hookName: 'start-pre-folder-detail-hook',
        hookData: FolderDetailHookDataStub({
          tool_name: 'Edit',
          tool_input: { file_path: BROKER_FILE },
          transcript_path: transcriptPath,
        }),
      });

      transcripts.cleanup();

      expect(result).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
    });

    it('VALID: {Write outside packages/*/src/<folderType>} => exit 0', () => {
      const transcripts = transcriptHarness();
      const transcriptPath = transcripts.write({ contents: plainLine });

      const result = runner.runHook({
        hookName: 'start-pre-folder-detail-hook',
        hookData: FolderDetailHookDataStub({
          tool_input: { file_path: '/repo/packages/hooks/test/harnesses/thing.ts' },
          transcript_path: transcriptPath,
        }),
      });

      transcripts.cleanup();

      expect(result).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
    });

    it('EDGE: {transcript file does not exist} => exit 0, fails open', () => {
      const transcripts = transcriptHarness();
      const transcriptPath = transcripts.missingPath();

      const result = runner.runHook({
        hookName: 'start-pre-folder-detail-hook',
        hookData: FolderDetailHookDataStub({
          tool_input: { file_path: BROKER_FILE },
          transcript_path: transcriptPath,
        }),
      });

      transcripts.cleanup();

      expect(result).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
    });
  });
});
