import {
  FlowNodeStub,
  FlowStub,
  QuestPackageEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questNodePackageCoverageViolationsTransformer } from './quest-node-package-coverage-violations-transformer';

const WEB_ENTRY = QuestPackageEntryStub({
  name: 'web',
  location: './packages/web',
  packageType: 'frontend-react',
});
const SERVER_ENTRY = QuestPackageEntryStub({
  name: 'server',
  location: './packages/server',
  packageType: 'http-backend',
});

describe('questNodePackageCoverageViolationsTransformer', () => {
  describe('every tag declared', () => {
    it('EMPTY: {flows: []} => returns empty array', () => {
      const { packagesAffected } = QuestStub({ packagesAffected: [WEB_ENTRY] });

      const offenders = questNodePackageCoverageViolationsTransformer({
        flows: [],
        packagesAffected,
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {seam flow, both tags in packagesAffected} => returns empty array', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [
          FlowNodeStub({ id: 'press-warp', packages: ['web'] }),
          FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] }),
        ],
      });

      const offenders = questNodePackageCoverageViolationsTransformer({
        flows: [flow],
        packagesAffected: [WEB_ENTRY, SERVER_ENTRY],
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {glue node tagging both declared packages} => returns empty array', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [FlowNodeStub({ id: 'press-warp', packages: ['web', 'server'] })],
      });

      const offenders = questNodePackageCoverageViolationsTransformer({
        flows: [flow],
        packagesAffected: [WEB_ENTRY, SERVER_ENTRY],
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('untagged node', () => {
    it('EMPTY: {node with packages: []} => names the node and says what a tag routes', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [FlowNodeStub({ id: 'press-warp', packages: ['web'] })],
      });
      // flowNodeContract enforces .min(1), so the untagged shape only reaches this transformer via
      // a merge that produced it; assign past the parse to exercise the branch it exists for.
      Object.assign(flow.nodes[0] as object, { packages: [] });

      const offenders = questNodePackageCoverageViolationsTransformer({
        flows: [flow],
        packagesAffected: [WEB_ENTRY],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node 'press-warp' in flow 'warpgate-merge' tags no package. Every node names at least one package it lands in — the tag is what routes the node's terminal and branch units, which carry no observable to read a package from. Tag it with a name from quest.packagesAffected, or with two when it spans a seam.",
      ]);
    });
  });

  describe('tag absent from packagesAffected', () => {
    it('INVALID: {node tags cli, packagesAffected has web} => names node, flow, package and the entry shape to add', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [FlowNodeStub({ id: 'press-warp', packages: ['cli'] })],
      });

      const offenders = questNodePackageCoverageViolationsTransformer({
        flows: [flow],
        packagesAffected: [WEB_ENTRY],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node 'press-warp' in flow 'warpgate-merge' tags package 'cli', which is not in quest.packagesAffected. Add an entry { name, location, changeType: 'edit' | 'new', packageType } — and for a 'new' package, usedBy[] naming its consumers — in the same modify-quest call, or retag the node.",
      ]);
    });

    it('INVALID: {glue node with one declared and one undeclared tag} => reports only the undeclared one', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [FlowNodeStub({ id: 'press-warp', packages: ['web', 'cli'] })],
      });

      const offenders = questNodePackageCoverageViolationsTransformer({
        flows: [flow],
        packagesAffected: [WEB_ENTRY],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node 'press-warp' in flow 'warpgate-merge' tags package 'cli', which is not in quest.packagesAffected. Add an entry { name, location, changeType: 'edit' | 'new', packageType } — and for a 'new' package, usedBy[] naming its consumers — in the same modify-quest call, or retag the node.",
      ]);
    });

    it('EMPTY: {packagesAffected: [], one tagged node} => every tag is undeclared', () => {
      const flow = FlowStub({
        id: 'warpgate-merge',
        nodes: [FlowNodeStub({ id: 'merge-status-ok', packages: ['server'] })],
      });

      const offenders = questNodePackageCoverageViolationsTransformer({
        flows: [flow],
        packagesAffected: [],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node 'merge-status-ok' in flow 'warpgate-merge' tags package 'server', which is not in quest.packagesAffected. Add an entry { name, location, changeType: 'edit' | 'new', packageType } — and for a 'new' package, usedBy[] naming its consumers — in the same modify-quest call, or retag the node.",
      ]);
    });

    it('INVALID: {two flows each holding an undeclared tag} => reports both, flow by flow', () => {
      const uiFlow = FlowStub({
        id: 'warpgate-merge',
        nodes: [FlowNodeStub({ id: 'press-warp', packages: ['cli'] })],
      });
      const apiFlow = FlowStub({
        id: 'followup-chat',
        nodes: [FlowNodeStub({ id: 'merge-status-ok', packages: ['tooling'] })],
      });

      const offenders = questNodePackageCoverageViolationsTransformer({
        flows: [uiFlow, apiFlow],
        packagesAffected: [WEB_ENTRY, SERVER_ENTRY],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node 'press-warp' in flow 'warpgate-merge' tags package 'cli', which is not in quest.packagesAffected. Add an entry { name, location, changeType: 'edit' | 'new', packageType } — and for a 'new' package, usedBy[] naming its consumers — in the same modify-quest call, or retag the node.",
        "Node 'merge-status-ok' in flow 'followup-chat' tags package 'tooling', which is not in quest.packagesAffected. Add an entry { name, location, changeType: 'edit' | 'new', packageType } — and for a 'new' package, usedBy[] naming its consumers — in the same modify-quest call, or retag the node.",
      ]);
    });
  });
});
