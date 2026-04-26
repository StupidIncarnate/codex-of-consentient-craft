import { locationsMcpJsonPathFindBroker } from './locations-mcp-json-path-find-broker';
import { locationsMcpJsonPathFindBrokerProxy } from './locations-mcp-json-path-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsMcpJsonPathFindBroker', () => {
  describe('mcp.json path resolution', () => {
    it('VALID: {startPath: "/project/src/file.ts"} => returns /project/.mcp.json', async () => {
      const proxy = locationsMcpJsonPathFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      proxy.setupMcpJsonPath({
        startPath: '/project/src/file.ts',
        configRootPath: '/project',
        mcpJsonPath: FilePathStub({ value: '/project/.mcp.json' }),
      });

      const result = await locationsMcpJsonPathFindBroker({ startPath });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/project/.mcp.json' }));
    });

    it('VALID: {startPath: "/monorepo/packages/web"} => walks up to /monorepo/.mcp.json', async () => {
      const proxy = locationsMcpJsonPathFindBrokerProxy();
      const startPath = FilePathStub({ value: '/monorepo/packages/web' });

      proxy.setupMcpJsonPath({
        startPath: '/monorepo/packages/web',
        configRootPath: '/monorepo',
        mcpJsonPath: FilePathStub({ value: '/monorepo/.mcp.json' }),
      });

      const result = await locationsMcpJsonPathFindBroker({ startPath });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/monorepo/.mcp.json' }));
    });
  });
});
