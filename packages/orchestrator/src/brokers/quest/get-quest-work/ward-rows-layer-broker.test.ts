import {
  AbsoluteFilePathStub,
  QuestStub,
  RiftcarverResultStub,
  WardDetailStub,
  WardResultStub,
} from '@dungeonmaster/shared/contracts';

import { wardRowsLayerBroker } from './ward-rows-layer-broker';
import { wardRowsLayerBrokerProxy } from './ward-rows-layer-broker.proxy';

const QUEST_PATH = AbsoluteFilePathStub({
  value: '/home/testuser/.dungeonmaster/guilds/g1/quests/001-add-auth',
});
const WARD_RESULT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const CARVE_ID = 'c3d4e5f6-e5f6-7890-abcd-ef1234567890';

const FAILING_DETAIL = JSON.stringify(
  WardDetailStub({
    checks: [
      {
        checkType: 'lint',
        status: 'pass',
        projectResults: [{ status: 'pass', errors: [] }],
      },
      {
        checkType: 'typecheck',
        status: 'fail',
        projectResults: [
          {
            status: 'fail',
            errors: [
              { filePath: '/repo/packages/web/src/a.ts', message: 'TS2322' },
              { filePath: '/repo/packages/web/src/a.ts', message: 'TS2345' },
              { filePath: '/repo/packages/web/src/b.ts', message: 'TS2322' },
            ],
          },
        ],
      },
    ],
  }),
);

describe('wardRowsLayerBroker', () => {
  describe('a failed ward result', () => {
    it('VALID: {a blob with one failing check} => failingCheckTypes names it and the passing one is absent', async () => {
      const proxy = wardRowsLayerBrokerProxy();
      proxy.setupBlobReadable({
        questPath: QUEST_PATH,
        wardResultId: WardResultStub({ id: WARD_RESULT_ID as never }).id,
        detailJson: FAILING_DETAIL,
      });

      const rows = await wardRowsLayerBroker({
        questPath: QUEST_PATH,
        quest: QuestStub({
          wardResults: [WardResultStub({ id: WARD_RESULT_ID as never, exitCode: 1 as never })],
        }),
      });

      expect(rows.ward?.failingCheckTypes.map(String)).toStrictEqual(['typecheck']);
    });

    it('VALID: {a file carrying two errors} => failingPaths de-duplicates it', async () => {
      const proxy = wardRowsLayerBrokerProxy();
      proxy.setupBlobReadable({
        questPath: QUEST_PATH,
        wardResultId: WardResultStub({ id: WARD_RESULT_ID as never }).id,
        detailJson: FAILING_DETAIL,
      });

      const rows = await wardRowsLayerBroker({
        questPath: QUEST_PATH,
        quest: QuestStub({
          wardResults: [WardResultStub({ id: WARD_RESULT_ID as never, exitCode: 1 as never })],
        }),
      });

      expect(rows.ward?.failingPaths.map(String)).toStrictEqual([
        '/repo/packages/web/src/a.ts',
        '/repo/packages/web/src/b.ts',
      ]);
    });

    it('VALID: {a failed result} => the row names the result and the blob beside it', async () => {
      const proxy = wardRowsLayerBrokerProxy();
      const wardResultId = WardResultStub({ id: WARD_RESULT_ID as never }).id;
      proxy.setupBlobReadable({
        questPath: QUEST_PATH,
        wardResultId,
        detailJson: FAILING_DETAIL,
      });

      const rows = await wardRowsLayerBroker({
        questPath: QUEST_PATH,
        quest: QuestStub({
          wardResults: [WardResultStub({ id: WARD_RESULT_ID as never, exitCode: 1 as never })],
        }),
      });

      expect({
        wardResultId: rows.ward?.wardResultId,
        runId: rows.ward?.runId,
        blobPath: rows.ward?.blobPath,
      }).toStrictEqual({
        wardResultId: WARD_RESULT_ID,
        runId: null,
        blobPath: String(proxy.blobPathFor({ questPath: QUEST_PATH, wardResultId })),
      });
    });

    it('VALID: {a blob that will not read} => the row survives with empty lists, so the pointer is not lost', async () => {
      const proxy = wardRowsLayerBrokerProxy();
      proxy.setupBlobMissing({
        questPath: QUEST_PATH,
        wardResultId: WardResultStub({ id: WARD_RESULT_ID as never }).id,
      });

      const rows = await wardRowsLayerBroker({
        questPath: QUEST_PATH,
        quest: QuestStub({
          wardResults: [WardResultStub({ id: WARD_RESULT_ID as never, exitCode: 1 as never })],
        }),
      });

      expect({
        wardResultId: rows.ward?.wardResultId,
        failingCheckTypes: rows.ward?.failingCheckTypes,
        failingPaths: rows.ward?.failingPaths,
      }).toStrictEqual({
        wardResultId: WARD_RESULT_ID,
        failingCheckTypes: [],
        failingPaths: [],
      });
    });
  });

  describe('no failed ward result', () => {
    it('EMPTY: {a green quest} => ward is null and nothing is read', async () => {
      wardRowsLayerBrokerProxy();

      const rows = await wardRowsLayerBroker({
        questPath: QUEST_PATH,
        quest: QuestStub({
          wardResults: [WardResultStub({ id: WARD_RESULT_ID as never, exitCode: 0 as never })],
        }),
      });

      expect({ ward: rows.ward, riftcarverLogPath: rows.riftcarverLogPath }).toStrictEqual({
        ward: null,
        riftcarverLogPath: null,
      });
    });
  });

  describe('the carve graph', () => {
    it('VALID: {a failed carve and no failed ward} => the log path is served and ward stays null', async () => {
      wardRowsLayerBrokerProxy();

      const rows = await wardRowsLayerBroker({
        questPath: QUEST_PATH,
        quest: QuestStub({
          riftcarverResults: [
            RiftcarverResultStub({
              id: CARVE_ID as never,
              exitCode: 1 as never,
              outcome: 'repairable',
            }),
          ],
        }),
      });

      expect({ ward: rows.ward, riftcarverLogPath: String(rows.riftcarverLogPath) }).toStrictEqual({
        ward: null,
        riftcarverLogPath: `${String(QUEST_PATH)}/riftcarver-results/${CARVE_ID}.log`,
      });
    });

    it('EMPTY: {a green carve} => riftcarverLogPath is null, never absent', async () => {
      wardRowsLayerBrokerProxy();

      const rows = await wardRowsLayerBroker({
        questPath: QUEST_PATH,
        quest: QuestStub({
          riftcarverResults: [
            RiftcarverResultStub({ id: CARVE_ID as never, exitCode: 0 as never, outcome: 'green' }),
          ],
        }),
      });

      expect(rows.riftcarverLogPath).toBe(null);
    });
  });
});
