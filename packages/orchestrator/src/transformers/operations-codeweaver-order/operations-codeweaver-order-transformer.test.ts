import { OperationItemStub, PackageGraphEntryStub } from '@dungeonmaster/shared/contracts';

import { operationsCodeweaverOrderTransformer } from './operations-codeweaver-order-transformer';

const LEAF = PackageGraphEntryStub({ id: 'shared', dependsOn: [], depth: 0 });
const MIDDLE = PackageGraphEntryStub({ id: 'server', dependsOn: ['shared'], depth: 1 });
const TOP = PackageGraphEntryStub({ id: 'cli', dependsOn: ['server'], depth: 2 });

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
