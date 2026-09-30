import { locationsWardResultsPathFindBroker } from './locations-ward-results-path-find-broker';
import { locationsWardResultsPathFindBrokerProxy } from './locations-ward-results-path-find-broker.proxy';

describe('locationsWardResultsPathFindBroker', () => {
  describe('ward-results path resolution', () => {
    it('VALID: {questFolderPath: "/quest"} => returns /quest/ward-results', () => {
      const proxy = locationsWardResultsPathFindBrokerProxy();

      proxy.setupWardResultsPath({
        questFolderPath: '/quest',
        wardResultsPath: '/quest/ward-results',
      });

      const result = locationsWardResultsPathFindBroker({
        questFolderPath: '/quest',
      });

      expect(result).toBe('/quest/ward-results');
    });
  });
});
