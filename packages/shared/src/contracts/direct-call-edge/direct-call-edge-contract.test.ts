import { directCallEdgeContract } from './direct-call-edge-contract';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

describe('directCallEdgeContract', () => {
  describe('parse', () => {
    it('VALID: {full edge with method names} => parses successfully', () => {
      const result = directCallEdgeContract.parse({
        callerPackage: ContentTextStub({ value: 'server' }),
        calleePackage: ContentTextStub({ value: 'orchestrator' }),
        adapterFiles: [
          AbsoluteFilePathStub({
            value:
              '/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts',
          }),
        ],
        methodNames: [ContentTextStub({ value: 'getQuest' })],
      });

      expect(result).toStrictEqual({
        callerPackage: 'server',
        calleePackage: 'orchestrator',
        adapterFiles: [
          '/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts',
        ],
        methodNames: ['getQuest'],
      });
    });

    it('VALID: {empty adapterFiles and methodNames} => parses successfully', () => {
      const result = directCallEdgeContract.parse({
        callerPackage: ContentTextStub({ value: 'server' }),
        calleePackage: ContentTextStub({ value: 'orchestrator' }),
        adapterFiles: [],
        methodNames: [],
      });

      expect(result).toStrictEqual({
        callerPackage: 'server',
        calleePackage: 'orchestrator',
        adapterFiles: [],
        methodNames: [],
      });
    });

    it('VALID: {multiple adapter files and methods} => parses successfully', () => {
      const result = directCallEdgeContract.parse({
        callerPackage: ContentTextStub({ value: 'server' }),
        calleePackage: ContentTextStub({ value: 'orchestrator' }),
        adapterFiles: [
          AbsoluteFilePathStub({
            value:
              '/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts',
          }),
          AbsoluteFilePathStub({
            value:
              '/repo/packages/server/src/adapters/orchestrator/add-quest/orchestrator-add-quest-adapter.ts',
          }),
        ],
        methodNames: [
          ContentTextStub({ value: 'getQuest' }),
          ContentTextStub({ value: 'addQuest' }),
        ],
      });

      expect(result).toStrictEqual({
        callerPackage: 'server',
        calleePackage: 'orchestrator',
        adapterFiles: [
          '/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts',
          '/repo/packages/server/src/adapters/orchestrator/add-quest/orchestrator-add-quest-adapter.ts',
        ],
        methodNames: ['getQuest', 'addQuest'],
      });
    });
  });
});
