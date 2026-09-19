import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { locationsPruneAssetPathsFindBroker } from './locations-prune-asset-paths-find-broker';
import { locationsPruneAssetPathsFindBrokerProxy } from './locations-prune-asset-paths-find-broker.proxy';

const EVIDENCE_DIR = '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21';

describe('locationsPruneAssetPathsFindBroker', () => {
  describe('instance-level asset resolution', () => {
    it('VALID: {evidencePath} => the runs directory, six process records and the three capture buffers, all absolute', () => {
      locationsPruneAssetPathsFindBrokerProxy();
      const evidencePath = AbsoluteFilePathStub({ value: EVIDENCE_DIR });

      const result = locationsPruneAssetPathsFindBroker({ evidencePath });

      expect(result).toStrictEqual({
        runsDir: AbsoluteFilePathStub({ value: `${EVIDENCE_DIR}/runs` }),
        logs: [
          AbsoluteFilePathStub({ value: `${EVIDENCE_DIR}/api-server.log` }),
          AbsoluteFilePathStub({ value: `${EVIDENCE_DIR}/web-server.log` }),
          AbsoluteFilePathStub({ value: `${EVIDENCE_DIR}/driver.log` }),
          AbsoluteFilePathStub({ value: `${EVIDENCE_DIR}/heartbeat.json` }),
          AbsoluteFilePathStub({ value: `${EVIDENCE_DIR}/boot-failure.json` }),
          AbsoluteFilePathStub({ value: `${EVIDENCE_DIR}/shutdown-reason.json` }),
        ],
        transcripts: [
          AbsoluteFilePathStub({ value: `${EVIDENCE_DIR}/console.jsonl` }),
          AbsoluteFilePathStub({ value: `${EVIDENCE_DIR}/network.jsonl` }),
          AbsoluteFilePathStub({ value: `${EVIDENCE_DIR}/ws.jsonl` }),
        ],
      });
    });

    it('VALID: {an unowned evidencePath} => the same set under the unowned partition, so no branch of prune is guild-only', () => {
      locationsPruneAssetPathsFindBrokerProxy();
      const evidencePath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/unowned/instances/inst_9b2c0001',
      });

      const result = locationsPruneAssetPathsFindBroker({ evidencePath });

      expect(result.runsDir).toBe('/repo/.siegelense/unowned/instances/inst_9b2c0001/runs');
    });
  });
});
