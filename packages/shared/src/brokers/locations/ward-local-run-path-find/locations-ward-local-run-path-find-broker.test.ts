import { locationsWardLocalRunPathFindBroker } from './locations-ward-local-run-path-find-broker';
import { locationsWardLocalRunPathFindBrokerProxy } from './locations-ward-local-run-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { WardRunIdStub } from '../../../contracts/ward-run-id/ward-run-id.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('locationsWardLocalRunPathFindBroker', () => {
  describe('ward run path resolution', () => {
    it('VALID: {rootPath: "/repo", runId: "abc-123"} => returns /repo/.ward/run-abc-123.json', () => {
      const proxy = locationsWardLocalRunPathFindBrokerProxy();

      proxy.setupWardLocalRunPath({
        runPath: FilePathStub({ value: '/repo/.ward/run-abc-123.json' }),
      });

      const result = locationsWardLocalRunPathFindBroker({
        rootPath: AbsoluteFilePathStub({ value: '/repo' }),
        runId: WardRunIdStub({ value: 'abc-123' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/repo/.ward/run-abc-123.json' }));
    });

    it('VALID: {rootPath: "/repo/packages/web"} => resolves workspace-local ward run file', () => {
      const proxy = locationsWardLocalRunPathFindBrokerProxy();

      proxy.setupWardLocalRunPath({
        runPath: FilePathStub({
          value: '/repo/packages/web/.ward/run-1739625600000-a3f1.json',
        }),
      });

      const result = locationsWardLocalRunPathFindBroker({
        rootPath: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
        runId: WardRunIdStub({ value: '1739625600000-a3f1' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/repo/packages/web/.ward/run-1739625600000-a3f1.json',
        }),
      );
    });
  });
});
