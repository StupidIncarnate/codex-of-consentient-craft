import { OperationItemStub, PackageGraphEntryStub } from '@dungeonmaster/shared/contracts';

import { operationsCodeweaverOrderTransformer } from './operations-codeweaver-order-transformer';

const LEAF = PackageGraphEntryStub({ id: 'shared', dependsOn: [], depth: 0 });
const MIDDLE = PackageGraphEntryStub({ id: 'server', dependsOn: ['shared'], depth: 1 });
const TOP = PackageGraphEntryStub({ id: 'cli', dependsOn: ['server'], depth: 2 });

// THIS REPO's measured manifest shape. `packages/server` depends on `@dungeonmaster/web` because it
// serves the built bundle, while `packages/web` depends only on `@dungeonmaster/shared` — so Kahn
// ranks shared 0, orchestrator 1, WEB 1 and SERVER 2, putting the browser package one whole rank
// ahead of the backend whose routes it calls.
const REPO_SHARED = PackageGraphEntryStub({
  id: 'shared',
  dependsOn: [],
  depth: 0,
  packageType: 'library',
});
const REPO_ORCHESTRATOR = PackageGraphEntryStub({
  id: 'orchestrator',
  dependsOn: ['shared'],
  depth: 1,
  packageType: 'programmatic-service',
});
const REPO_WEB = PackageGraphEntryStub({
  id: 'web',
  dependsOn: ['shared'],
  depth: 1,
  packageType: 'frontend-react',
});
const REPO_SERVER = PackageGraphEntryStub({
  id: 'server',
  dependsOn: ['shared', 'orchestrator', 'web'],
  depth: 2,
  packageType: 'http-backend',
});

describe('operationsCodeweaverOrderTransformer', () => {
  describe('dependency ordering', () => {
    it('VALID: {codeweaver items authored top-down} => returns them dependencies-first', () => {
      const cliItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'cli: wire the new flag',
        packageNames: ['cli'],
      });
      const sharedItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'shared: add the contract',
        packageNames: ['shared'],
      });
      const serverItem = OperationItemStub({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        text: 'server: expose the route',
        packageNames: ['server'],
      });

      const result = operationsCodeweaverOrderTransformer({
        operations: [cliItem, sharedItem, serverItem],
        packageGraph: [LEAF, MIDDLE, TOP],
      });

      expect(result).toStrictEqual([sharedItem, serverItem, cliItem]);
    });

    it('VALID: {an item naming two packages} => ranks at the SHALLOWEST of them, so glue work lands with its dependencies', () => {
      const glueItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'cli+shared: thread the flag through',
        packageNames: ['cli', 'shared'],
      });
      const serverItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'server: expose the route',
        packageNames: ['server'],
      });

      const result = operationsCodeweaverOrderTransformer({
        operations: [serverItem, glueItem],
        packageGraph: [LEAF, MIDDLE, TOP],
      });

      expect(result).toStrictEqual([glueItem, serverItem]);
    });

    it('VALID: {two items at the same depth} => the authored order between them is kept', () => {
      const firstShared = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'shared: add the contract',
        packageNames: ['shared'],
      });
      const secondShared = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'shared: add the transformer',
        packageNames: ['shared'],
      });

      const result = operationsCodeweaverOrderTransformer({
        operations: [firstShared, secondShared],
        packageGraph: [LEAF],
      });

      expect(result).toStrictEqual([firstShared, secondShared]);
    });

    it('VALID: {an item naming a package the graph does not carry} => sorts last, behind every ranked item', () => {
      const unknownItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'docs: rewrite the runbook',
        packageNames: ['docs'],
      });
      const sharedItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'shared: add the contract',
        packageNames: ['shared'],
      });

      const result = operationsCodeweaverOrderTransformer({
        operations: [unknownItem, sharedItem],
        packageGraph: [LEAF],
      });

      expect(result).toStrictEqual([sharedItem, unknownItem]);
    });
  });

  describe('package KIND outranks manifest depth', () => {
    // The inverted case the tier list exists for. Under a depth-only sort web (depth 1) precedes
    // server (depth 2) and the browser session builds an action bar against a route nothing serves
    // yet; ranking on kind puts the http-backend tier ahead of the frontend-react one.
    it("VALID: {this repo's manifest, where server depends on web} => server sorts BEFORE web", () => {
      const webItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'web: render the follow-up action bar',
        packageNames: ['web'],
      });
      const serverItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'server: expose POST /api/quests/:questId/followup',
        packageNames: ['server'],
      });

      const result = operationsCodeweaverOrderTransformer({
        operations: [webItem, serverItem],
        packageGraph: [REPO_SHARED, REPO_ORCHESTRATOR, REPO_WEB, REPO_SERVER],
      });

      expect(result).toStrictEqual([serverItem, webItem]);
    });

    it('VALID: {one item per repo package, authored browser-first} => library, then programmatic-service, then http-backend, then frontend-react', () => {
      const webItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'web: render the follow-up action bar',
        packageNames: ['web'],
      });
      const serverItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'server: expose POST /api/quests/:questId/followup',
        packageNames: ['server'],
      });
      const orchestratorItem = OperationItemStub({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        text: 'orchestrator: build the follow-up chat prompt',
        packageNames: ['orchestrator'],
      });
      const sharedItem = OperationItemStub({
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        text: 'shared: add the tavernkeeper work-item role',
        packageNames: ['shared'],
      });

      const result = operationsCodeweaverOrderTransformer({
        operations: [webItem, serverItem, orchestratorItem, sharedItem],
        packageGraph: [REPO_SHARED, REPO_ORCHESTRATOR, REPO_WEB, REPO_SERVER],
      });

      expect(result).toStrictEqual([sharedItem, orchestratorItem, serverItem, webItem]);
    });

    // Depth is not discarded — it is demoted to the tiebreak, where the manifests are telling the
    // truth: two packages of the same kind, one importing the other.
    it('VALID: {two http-backend packages at different depths} => depth still decides WITHIN the tier', () => {
      const gateway = PackageGraphEntryStub({
        id: 'gateway',
        dependsOn: [],
        depth: 0,
        packageType: 'http-backend',
      });
      const deeperServer = PackageGraphEntryStub({
        id: 'server',
        dependsOn: ['gateway'],
        depth: 1,
        packageType: 'http-backend',
      });
      const serverItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'server: expose the route',
        packageNames: ['server'],
      });
      const gatewayItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'gateway: forward the route',
        packageNames: ['gateway'],
      });

      const result = operationsCodeweaverOrderTransformer({
        operations: [serverItem, gatewayItem],
        packageGraph: [gateway, deeperServer],
      });

      expect(result).toStrictEqual([gatewayItem, serverItem]);
    });

    // An item naming two packages ranks at the LOWEST tier of them, so glue work lands with the
    // dependency it is glued to rather than behind its consumer.
    it('VALID: {an item naming both web and server} => ranks at the http-backend tier, ahead of the pure web item', () => {
      const glueItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'web+server: thread the follow-up payload through',
        packageNames: ['web', 'server'],
      });
      const webItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'web: render the follow-up action bar',
        packageNames: ['web'],
      });

      const result = operationsCodeweaverOrderTransformer({
        operations: [webItem, glueItem],
        packageGraph: [REPO_SHARED, REPO_ORCHESTRATOR, REPO_WEB, REPO_SERVER],
      });

      expect(result).toStrictEqual([glueItem, webItem]);
    });
  });

  describe('positions nothing else occupies', () => {
    it('VALID: {a chat item sitting between two codeweaver items} => it stays at its own index while only the codeweaver items swap', () => {
      const intake = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'chaoswhisperer',
        text: 'Author spec + implementation plan',
        status: 'complete',
      });
      const cliItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'cli: wire the new flag',
        packageNames: ['cli'],
      });
      const sharedItem = OperationItemStub({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        text: 'shared: add the contract',
        packageNames: ['shared'],
      });

      const result = operationsCodeweaverOrderTransformer({
        operations: [cliItem, intake, sharedItem],
        packageGraph: [LEAF, MIDDLE, TOP],
      });

      expect(result).toStrictEqual([sharedItem, intake, cliItem]);
    });
  });

  describe('nothing to rank', () => {
    it('VALID: {no packageNames on any item} => every item ties and the authored order comes back unchanged', () => {
      const first = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'cli: wire the new flag',
      });
      const second = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'shared: add the contract',
      });

      const result = operationsCodeweaverOrderTransformer({
        operations: [first, second],
        packageGraph: [LEAF, MIDDLE, TOP],
      });

      expect(result).toStrictEqual([first, second]);
    });

    it('EMPTY: {packageGraph not stamped yet} => the authored order comes back unchanged', () => {
      const cliItem = OperationItemStub({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        text: 'cli: wire the new flag',
        packageNames: ['cli'],
      });
      const sharedItem = OperationItemStub({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        text: 'shared: add the contract',
        packageNames: ['shared'],
      });

      const result = operationsCodeweaverOrderTransformer({
        operations: [cliItem, sharedItem],
        packageGraph: [],
      });

      expect(result).toStrictEqual([cliItem, sharedItem]);
    });

    it('EMPTY: {no operations} => returns an empty ledger', () => {
      const result = operationsCodeweaverOrderTransformer({
        operations: [],
        packageGraph: [LEAF],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
