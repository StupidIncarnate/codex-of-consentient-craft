import { fsOpenFdAdapter } from './fs-open-fd-adapter';
import { fsOpenFdAdapterProxy } from './fs-open-fd-adapter.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { FileDescriptorStub } from '../../../contracts/file-descriptor/file-descriptor.stub';

describe('fsOpenFdAdapter', () => {
  describe('successful opens', () => {
    it('VALID: {filePath} => returns the branded file descriptor', () => {
      const proxy = fsOpenFdAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-inst_7f3a9c21/api-server.log',
      });
      const fd = FileDescriptorStub({ value: 12 });

      proxy.returns({ filePath, fd });

      const result = fsOpenFdAdapter({ filePath });

      expect(result).toBe(12);
    });

    it('VALID: {filePath} => opens in append mode', () => {
      const proxy = fsOpenFdAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-inst_7f3a9c21/api-server.log',
      });
      const fd = FileDescriptorStub({ value: 12 });

      proxy.returns({ filePath, fd });

      fsOpenFdAdapter({ filePath });

      expect(proxy.getFlagFor({ filePath })).toBe('a');
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: unwritable directory} => throws permission denied error', () => {
      const proxy = fsOpenFdAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/readonly/api-server.log' });

      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      expect(() => fsOpenFdAdapter({ filePath })).toThrow(/EACCES/u);
    });
  });
});
