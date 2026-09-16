import { fsCloseFdAdapter } from './fs-close-fd-adapter';
import { fsCloseFdAdapterProxy } from './fs-close-fd-adapter.proxy';
import { FileDescriptorStub } from '../../../contracts/file-descriptor/file-descriptor.stub';

describe('fsCloseFdAdapter', () => {
  describe('successful closes', () => {
    it('VALID: {fd} => closes the descriptor successfully', () => {
      const proxy = fsCloseFdAdapterProxy();
      const fd = FileDescriptorStub({ value: 12 });

      proxy.succeeds({ fd });

      expect(fsCloseFdAdapter({ fd })).toStrictEqual({ success: true });
    });

    it('VALID: {fd} => closes the exact descriptor passed in', () => {
      const proxy = fsCloseFdAdapterProxy();
      const fd = FileDescriptorStub({ value: 12 });

      proxy.succeeds({ fd });

      fsCloseFdAdapter({ fd });

      expect(proxy.getClosedFds()).toStrictEqual([12]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {fd: already closed} => throws EBADF error', () => {
      const proxy = fsCloseFdAdapterProxy();
      const fd = FileDescriptorStub({ value: 12 });

      proxy.throws({ fd, error: new Error('EBADF: bad file descriptor') });

      expect(() => fsCloseFdAdapter({ fd })).toThrow(/EBADF/u);
    });
  });
});
