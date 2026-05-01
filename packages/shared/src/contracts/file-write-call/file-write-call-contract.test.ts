import { fileWriteCallContract } from './file-write-call-contract';
import { FileWriteCallStub } from './file-write-call.stub';

describe('fileWriteCallContract', () => {
  describe('valid calls', () => {
    it('VALID: {adapter, filePathArg} => parses successfully', () => {
      const result = FileWriteCallStub();

      const parsed = fileWriteCallContract.parse(result);

      expect(parsed).toStrictEqual({
        adapter: 'fsWriteFileAdapter',
        filePathArg: '/stub/path/quest.json',
      });
    });

    it('VALID: {computed filePathArg} => parses successfully', () => {
      const result = FileWriteCallStub({ filePathArg: '<computed: questDirBroker>' });

      const parsed = fileWriteCallContract.parse(result);

      expect(parsed).toStrictEqual({
        adapter: 'fsWriteFileAdapter',
        filePathArg: '<computed: questDirBroker>',
      });
    });
  });

  describe('invalid calls', () => {
    it('INVALID: {missing adapter} => throws validation error', () => {
      expect(() => {
        return fileWriteCallContract.parse({ filePathArg: '/quest.json' });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing filePathArg} => throws validation error', () => {
      expect(() => {
        return fileWriteCallContract.parse({ adapter: 'fsWriteFileAdapter' });
      }).toThrow(/Required/u);
    });
  });
});
