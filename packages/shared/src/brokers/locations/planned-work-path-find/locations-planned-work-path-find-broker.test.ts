import { locationsPlannedWorkPathFindBroker } from './locations-planned-work-path-find-broker';
import { locationsPlannedWorkPathFindBrokerProxy } from './locations-planned-work-path-find-broker.proxy';

describe('locationsPlannedWorkPathFindBroker', () => {
  describe('planned-work path resolution', () => {
    it('VALID: {questFolderPath: "/quest"} => returns /quest/planned-work', () => {
      const proxy = locationsPlannedWorkPathFindBrokerProxy();

      proxy.setupPlannedWorkPath({
        plannedWorkPath: '/quest/planned-work',
      });

      const result = locationsPlannedWorkPathFindBroker({
        questFolderPath: '/quest',
      });

      expect(result).toBe('/quest/planned-work');
    });
  });
});
