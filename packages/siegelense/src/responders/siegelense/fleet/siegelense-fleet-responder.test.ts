import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceStateStub } from '../../../contracts/instance-state/instance-state.stub';
import { PortPairStub } from '../../../contracts/port-pair/port-pair.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RepoLocalPathStub } from '../../../contracts/repo-local-path/repo-local-path.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';

import { SiegelenseFleetResponder } from './siegelense-fleet-responder';
import { SiegelenseFleetResponderProxy } from './siegelense-fleet-responder.proxy';

describe('SiegelenseFleetResponder', () => {
  describe('no instances running', () => {
    it('EMPTY: {registry: no instances} => writes the empty-fleet message', async () => {
      const proxy = SiegelenseFleetResponderProxy();
      proxy.stageEmptyRegistry();

      await SiegelenseFleetResponder();

      expect(proxy.getStdoutWrites()).toStrictEqual(['No siegelense instances running.\n']);
    });
  });

  describe('one instance running', () => {
    it('VALID: {one alive instance} => writes the header then that instance row', async () => {
      const proxy = SiegelenseFleetResponderProxy();
      const entry = RegistryEntryStub({
        id: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
        ports: PortPairStub({ api: 34_172, web: 34_173 }),
        state: InstanceStateStub({ value: 'alive' }),
        lastBeatMs: null,
      });
      const evidence = RepoLocalPathStub({
        path: '/repo/.siegelense/unowned/instances/inst_7f3a9c21',
      });
      proxy.stageInstance({ entry, evidence });

      await SiegelenseFleetResponder();

      expect(proxy.getStdoutWrites()).toStrictEqual([
        'ID\tSTATE\tSPEC\tPORTS\tLAST BEAT\tEVIDENCE\n',
        'inst_7f3a9c21\talive\tdungeonmaster-web\t34172/34173\t-\t/repo/.siegelense/unowned/instances/inst_7f3a9c21\n',
      ]);
    });
  });
});
