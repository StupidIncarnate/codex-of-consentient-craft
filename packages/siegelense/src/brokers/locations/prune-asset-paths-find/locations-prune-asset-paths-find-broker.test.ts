import { locationsPruneAssetPathsFindBroker } from './locations-prune-asset-paths-find-broker';
import { locationsPruneAssetPathsFindBrokerProxy } from './locations-prune-asset-paths-find-broker.proxy';

const EVIDENCE_DIR =
  '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21';

describe('locationsPruneAssetPathsFindBroker', () => {
  describe('instance-level asset resolution', () => {
    it('VALID: {evidencePath} => the runs directory, six process records and the three capture buffers, all absolute', () => {
      locationsPruneAssetPathsFindBrokerProxy();
      const evidencePath = EVIDENCE_DIR;

      const result = locationsPruneAssetPathsFindBroker({ evidencePath });

      expect(result).toStrictEqual({
        runsDir: `${EVIDENCE_DIR}/runs`,
        videoDir: `${EVIDENCE_DIR}/video`,
        logs: [
          `${EVIDENCE_DIR}/api-server.log`,
          `${EVIDENCE_DIR}/web-server.log`,
          `${EVIDENCE_DIR}/driver.log`,
          `${EVIDENCE_DIR}/heartbeat.json`,
          `${EVIDENCE_DIR}/boot-failure.json`,
          `${EVIDENCE_DIR}/shutdown-reason.json`,
        ],
        transcripts: [
          `${EVIDENCE_DIR}/console.jsonl`,
          `${EVIDENCE_DIR}/network.jsonl`,
          `${EVIDENCE_DIR}/ws.jsonl`,
        ],
      });
    });

    it('VALID: {an unowned evidencePath} => the same set under the unowned partition, so no branch of prune is guild-only', () => {
      locationsPruneAssetPathsFindBrokerProxy();
      const evidencePath =
        '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_9b2c0001';

      const result = locationsPruneAssetPathsFindBroker({ evidencePath });

      expect({ runsDir: result.runsDir, videoDir: result.videoDir }).toStrictEqual({
        runsDir:
          '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_9b2c0001/runs',
        videoDir:
          '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_9b2c0001/video',
      });
    });
  });
});
