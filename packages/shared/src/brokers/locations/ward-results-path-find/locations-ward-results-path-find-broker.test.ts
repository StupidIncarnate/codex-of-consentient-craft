import { locationsWardResultsPathFindBroker } from './locations-ward-results-path-find-broker';
import { locationsWardResultsPathFindBrokerProxy } from './locations-ward-results-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('locationsWardResultsPathFindBroker', () => {
  describe('ward-results path resolution', () => {
    it('VALID: {questFolderPath: "/quest"} => returns /quest/ward-results', () => {
      const proxy = locationsWardResultsPathFindBrokerProxy();

      proxy.setupWardResultsPath({
        wardResultsPath: FilePathStub({ value: '/quest/ward-results' }),
      });

      const result = locationsWardResultsPathFindBroker({
        questFolderPath: AbsoluteFilePathStub({ value: '/quest' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/quest/ward-results' }));
    });
  });
});
