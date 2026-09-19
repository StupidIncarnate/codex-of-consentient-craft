import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { verifiedPreludeLayerBroker } from './verified-prelude-layer-broker';
import { verifiedPreludeLayerBrokerProxy } from './verified-prelude-layer-broker.proxy';

const WORKTREE = '/repo/worktrees/add-auth-7bc217a1';
const PLANS_DIR = `${WORKTREE}/.quest-plans`;
const INSTANCE = 'inst_9b2c0001';

describe('verifiedPreludeLayerBroker', () => {
  describe('a plan directory with a VERIFIED prelude', () => {
    it('VALID: {a line naming run_7, an instance holding run_7} => one citation carrying the real file path', async () => {
      const proxy = verifiedPreludeLayerBrokerProxy();
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }),
        entries: ['path-3.md'],
      });
      proxy.setupPlanFile({
        filePath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/path-3.md` }),
        contents: '  VERIFIED  run_7 · 2026-09-14 · prelude reached the entry\n',
      });

      const result = await verifiedPreludeLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result).toStrictEqual([
        {
          kind: 'verified-prelude',
          instanceId: INSTANCE,
          runId: 'run_7',
          citingFile: `${PLANS_DIR}/path-3.md`,
          why: `run_7 cited by a VERIFIED prelude in ${PLANS_DIR}/path-3.md`,
        },
      ]);
    });

    it('EDGE: {ten VERIFIED lines in one file} => ONE citation, because ten lines in one prelude are one reason', async () => {
      const proxy = verifiedPreludeLayerBrokerProxy();
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }),
        entries: ['path-3.md'],
      });
      proxy.setupPlanFile({
        filePath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/path-3.md` }),
        contents: '  VERIFIED  run_7\n  VERIFIED  run_7\n  VERIFIED  run_7\n',
      });

      const result = await verifiedPreludeLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result.map((reference) => String(reference.citingFile))).toStrictEqual([
        `${PLANS_DIR}/path-3.md`,
      ]);
    });

    it('VALID: {two plan files, both citing} => one citation per FILE, so a caller can open each', async () => {
      const proxy = verifiedPreludeLayerBrokerProxy();
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }),
        entries: ['path-3.md', 'path-4.md'],
      });
      proxy.setupPlanFile({
        filePath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/path-3.md` }),
        contents: '  VERIFIED  run_7\n',
      });
      proxy.setupPlanFile({
        filePath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/path-4.md` }),
        contents: '  VERIFIED  run_9\n',
      });

      const result = await verifiedPreludeLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
        runIds: [RunIdStub({ value: 'run_7' }), RunIdStub({ value: 'run_9' })],
      });

      expect(result.map((reference) => String(reference.citingFile))).toStrictEqual([
        `${PLANS_DIR}/path-3.md`,
        `${PLANS_DIR}/path-4.md`,
      ]);
    });
  });

  describe('run ids that only look alike', () => {
    it('EDGE: {a line naming run_70, an instance holding run_7} => no citation, because run_7 is not a prefix match', async () => {
      const proxy = verifiedPreludeLayerBrokerProxy();
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }),
        entries: ['path-3.md'],
      });
      proxy.setupPlanFile({
        filePath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/path-3.md` }),
        contents: '  VERIFIED  run_70 · 2026-09-14\n',
      });

      const result = await verifiedPreludeLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a plan directory with nothing citing', () => {
    it('EMPTY: {no entries} => no citations', async () => {
      const proxy = verifiedPreludeLayerBrokerProxy();
      proxy.setupPlansDir({ dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }), entries: [] });

      const result = await verifiedPreludeLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
        runIds: [RunIdStub({ value: 'run_7' })],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {a VERIFIED line naming a run this instance never had} => no citation', async () => {
      const proxy = verifiedPreludeLayerBrokerProxy();
      proxy.setupPlansDir({
        dirPath: AbsoluteFilePathStub({ value: PLANS_DIR }),
        entries: ['path-3.md'],
      });
      proxy.setupPlanFile({
        filePath: AbsoluteFilePathStub({ value: `${PLANS_DIR}/path-3.md` }),
        contents: '  VERIFIED  run_7 · 2026-09-14\n',
      });

      const result = await verifiedPreludeLayerBroker({
        instanceId: InstanceIdStub({ value: INSTANCE }),
        worktreePath: AbsoluteFilePathStub({ value: WORKTREE }),
        runIds: [RunIdStub({ value: 'run_1' })],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
