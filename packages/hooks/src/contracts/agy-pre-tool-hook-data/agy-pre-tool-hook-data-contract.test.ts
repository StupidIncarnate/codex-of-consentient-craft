import { agyPreToolHookDataContract } from './agy-pre-tool-hook-data-contract';
import { AgyPreToolHookDataStub } from './agy-pre-tool-hook-data.stub';

describe('agyPreToolHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = AgyPreToolHookDataStub();

    expect(result).toStrictEqual({
      toolCall: {
        name: 'run_command',
        args: {
          CommandLine: 'npm test',
        },
      },
    });
  });

  it('VALID: {all fields populated} => parses successfully', () => {
    const result = agyPreToolHookDataContract.parse({
      conversationId: 'test-conv-id',
      workspacePaths: ['/test/path'],
      transcriptPath: '/test/transcript.jsonl',
      artifactDirectoryPath: '/test/artifacts',
      modelName: 'auto',
      stepIdx: 5,
      toolCall: {
        name: 'view_file',
        args: { AbsolutePath: '/test/file.ts' },
      },
    });

    expect(result).toStrictEqual({
      conversationId: 'test-conv-id',
      workspacePaths: ['/test/path'],
      transcriptPath: '/test/transcript.jsonl',
      artifactDirectoryPath: '/test/artifacts',
      modelName: 'auto',
      stepIdx: 5,
      toolCall: {
        name: 'view_file',
        args: { AbsolutePath: '/test/file.ts' },
      },
    });
  });
});
