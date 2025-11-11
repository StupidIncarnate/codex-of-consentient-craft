import { violationsCheckNewBroker } from './violations-check-new-broker';
import { violationsCheckNewBrokerProxy } from './violations-check-new-broker.proxy';
import { WriteToolInputStub } from '../../../contracts/write-tool-input/write-tool-input.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('violationsCheckNewBroker', () => {
  describe('input validation', () => {
    it('VALID: {toolInput: valid file_path} => returns no new violations when no changes', async () => {
      violationsCheckNewBrokerProxy();
      const toolInput = WriteToolInputStub({
        content: 'test',
        file_path: FilePathStub({ value: '/test/file.ts' }),
      });

      const result = await violationsCheckNewBroker({
        toolInput,
        cwd: FilePathStub({ value: '/test/project' }),
      });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
      });
    });
  });
});
