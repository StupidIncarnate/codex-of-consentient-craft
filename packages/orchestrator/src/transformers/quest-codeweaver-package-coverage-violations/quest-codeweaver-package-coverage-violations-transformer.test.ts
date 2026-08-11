import { FlowNodeStub, FlowStub, OperationItemStub } from '@dungeonmaster/shared/contracts';

import { questCodeweaverPackageCoverageViolationsTransformer } from './quest-codeweaver-package-coverage-violations-transformer';

const SEAM_FLOW = FlowStub({
  id: 'warpgate-merge',
  nodes: [
    FlowNodeStub({ id: 'press-warp', packages: ['web'] }),
    FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] }),
  ],
});

describe('questCodeweaverPackageCoverageViolationsTransformer', () => {
  describe('ledger covers the spine', () => {
    it('EMPTY: {flows: [], operations: []} => returns empty array', () => {
      const offenders = questCodeweaverPackageCoverageViolationsTransformer({
        flows: [],
        operations: [],
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {one codeweaver item claiming both packages} => returns empty array', () => {
      const offenders = questCodeweaverPackageCoverageViolationsTransformer({
        flows: [SEAM_FLOW],
        operations: [OperationItemStub({ role: 'codeweaver', packageNames: ['web', 'server'] })],
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {two codeweaver items each claiming one package} => the union covers the spine', () => {
      const offenders = questCodeweaverPackageCoverageViolationsTransformer({
        flows: [SEAM_FLOW],
        operations: [
          OperationItemStub({
            id: '11111111-1111-4111-8111-111111111111',
            role: 'codeweaver',
            packageNames: ['web'],
          }),
          OperationItemStub({
            id: '22222222-2222-4222-8222-222222222222',
            role: 'codeweaver',
            packageNames: ['server'],
          }),
        ],
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('ledger missing a package', () => {
    it('INVALID: {codeweaver item claims web only} => names server, the node that tags it, and where to add it', () => {
      const offenders = questCodeweaverPackageCoverageViolationsTransformer({
        flows: [SEAM_FLOW],
        operations: [OperationItemStub({ role: 'codeweaver', packageNames: ['web'] })],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package 'server' is tagged on node 'merge-status-ok' in flow 'warpgate-merge' but no codeweaver operation item declares it in packageNames. Every package the spine lands in needs an implementation item that names it, or the dependency-ordered dispatch has nothing to schedule there — add 'server' to an existing codeweaver item's packageNames, or author an item for it.",
      ]);
    });

    it('INVALID: {a flowrider item claims server, no codeweaver item does} => a verification item does not count as implementation', () => {
      const offenders = questCodeweaverPackageCoverageViolationsTransformer({
        flows: [SEAM_FLOW],
        operations: [
          OperationItemStub({
            id: '11111111-1111-4111-8111-111111111111',
            role: 'codeweaver',
            packageNames: ['web'],
          }),
          OperationItemStub({
            id: '33333333-3333-4333-8333-333333333333',
            role: 'flowrider',
            packageNames: ['server'],
          }),
        ],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package 'server' is tagged on node 'merge-status-ok' in flow 'warpgate-merge' but no codeweaver operation item declares it in packageNames. Every package the spine lands in needs an implementation item that names it, or the dependency-ordered dispatch has nothing to schedule there — add 'server' to an existing codeweaver item's packageNames, or author an item for it.",
      ]);
    });

    it('EMPTY: {operations: []} => every tagged package is uncovered, one sentence each', () => {
      const offenders = questCodeweaverPackageCoverageViolationsTransformer({
        flows: [SEAM_FLOW],
        operations: [],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package 'web' is tagged on node 'press-warp' in flow 'warpgate-merge' but no codeweaver operation item declares it in packageNames. Every package the spine lands in needs an implementation item that names it, or the dependency-ordered dispatch has nothing to schedule there — add 'web' to an existing codeweaver item's packageNames, or author an item for it.",
        "Package 'server' is tagged on node 'merge-status-ok' in flow 'warpgate-merge' but no codeweaver operation item declares it in packageNames. Every package the spine lands in needs an implementation item that names it, or the dependency-ordered dispatch has nothing to schedule there — add 'server' to an existing codeweaver item's packageNames, or author an item for it.",
      ]);
    });

    it('INVALID: {the same uncovered package tagged on three nodes across two flows} => one sentence, pointing at the first witness', () => {
      const uiFlow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({ id: 'press-warp', packages: ['web'] }),
          FlowNodeStub({ id: 'warp-spinner', packages: ['web'] }),
        ],
      });
      const chatFlow = FlowStub({
        id: 'followup-chat',
        nodes: [FlowNodeStub({ id: 'chat-open', packages: ['web'] })],
      });

      const offenders = questCodeweaverPackageCoverageViolationsTransformer({
        flows: [uiFlow, chatFlow],
        operations: [OperationItemStub({ role: 'codeweaver', packageNames: [] })],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package 'web' is tagged on node 'press-warp' in flow 'warpgate-merge' but no codeweaver operation item declares it in packageNames. Every package the spine lands in needs an implementation item that names it, or the dependency-ordered dispatch has nothing to schedule there — add 'web' to an existing codeweaver item's packageNames, or author an item for it.",
      ]);
    });
  });
});
