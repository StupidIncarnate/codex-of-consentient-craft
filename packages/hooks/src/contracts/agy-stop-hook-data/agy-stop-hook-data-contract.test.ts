import { agyStopHookDataContract } from './agy-stop-hook-data-contract';
import { AgyStopHookDataStub } from './agy-stop-hook-data.stub';

describe('agyStopHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = AgyStopHookDataStub();

    expect(result).toStrictEqual({
      fullyIdle: true,
      terminationReason: 'model_stop',
    });
  });

  it('VALID: {all fields populated} => parses successfully', () => {
    const result = agyStopHookDataContract.parse({
      executionNum: 1,
      terminationReason: 'model_stop',
      error: '',
      fullyIdle: false,
      conversationId: 'conv-123',
      workspacePaths: ['/workspace'],
      transcriptPath: '/transcript.jsonl',
      artifactDirectoryPath: '/artifacts',
      modelName: 'auto',
    });

    expect(result).toStrictEqual({
      executionNum: 1,
      terminationReason: 'model_stop',
      error: '',
      fullyIdle: false,
      conversationId: 'conv-123',
      workspacePaths: ['/workspace'],
      transcriptPath: '/transcript.jsonl',
      artifactDirectoryPath: '/artifacts',
      modelName: 'auto',
    });
  });
});
