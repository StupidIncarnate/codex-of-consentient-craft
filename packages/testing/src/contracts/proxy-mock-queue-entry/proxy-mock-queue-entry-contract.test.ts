import { proxyMockQueueEntryContract } from './proxy-mock-queue-entry-contract';
import { ProxyMockQueueEntryStub } from './proxy-mock-queue-entry.stub';
import { FilePathStub } from '../file-path/file-path.stub';
import { IdentifierNameStub } from '../identifier-name/identifier-name.stub';

describe('proxyMockQueueEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {requestedNames: null} => parses an unconstrained entry', () => {
      const entry = ProxyMockQueueEntryStub({
        filePath: FilePathStub({ value: '/repo/packages/shared/testing.ts' }),
        requestedNames: null,
      });

      const result = proxyMockQueueEntryContract.parse(entry);

      expect(result).toStrictEqual({
        filePath: '/repo/packages/shared/testing.ts',
        requestedNames: null,
      });
    });

    it('VALID: {requestedNames: [name]} => parses a name-constrained entry', () => {
      const entry = ProxyMockQueueEntryStub({
        filePath: FilePathStub({ value: '/repo/packages/shared/src/a.proxy.ts' }),
        requestedNames: [IdentifierNameStub({ value: 'pathJoinAdapterProxy' })],
      });

      const result = proxyMockQueueEntryContract.parse(entry);

      expect(result).toStrictEqual({
        filePath: '/repo/packages/shared/src/a.proxy.ts',
        requestedNames: ['pathJoinAdapterProxy'],
      });
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {missing filePath} => throws validation error', () => {
      expect(() => {
        return proxyMockQueueEntryContract.parse({ requestedNames: null });
      }).toThrow(/received undefined/u);
    });
  });
});
