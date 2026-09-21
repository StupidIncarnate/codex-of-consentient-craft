import { locationsPlannedWorkPathFindBroker } from './locations-planned-work-path-find-broker';
import { locationsPlannedWorkPathFindBrokerProxy } from './locations-planned-work-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('locationsPlannedWorkPathFindBroker', () => {
  describe('planned-work path resolution', () => {
    it('VALID: {questFolderPath: "/quest"} => returns /quest/planned-work', () => {
      const proxy = locationsPlannedWorkPathFindBrokerProxy();

      proxy.setupPlannedWorkPath({
        plannedWorkPath: FilePathStub({ value: '/quest/planned-work' }),
      });

      const result = locationsPlannedWorkPathFindBroker({
        questFolderPath: AbsoluteFilePathStub({ value: '/quest' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/quest/planned-work' }));
    });
  });
});
