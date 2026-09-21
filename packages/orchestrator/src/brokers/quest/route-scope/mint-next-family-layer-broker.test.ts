import {
  FlowNodeStub,
  FlowStub,
  OperationItemStub,
  QuestPackageEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { mintNextFamilyLayerBroker } from './mint-next-family-layer-broker';
import { mintNextFamilyLayerBrokerProxy } from './mint-next-family-layer-broker.proxy';

const UUIDS = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
] as const;

const WEB_PACKAGE = QuestPackageEntryStub({
  name: 'web',
  location: './packages/web',
  changeType: 'edit',
  packageType: 'frontend-react',
});

const RUNTIME_QUEST = QuestStub({
  packagesAffected: [WEB_PACKAGE],
  flows: [
    FlowStub({
      id: 'send-flow',
      name: 'Send',
      flowType: 'runtime',
      nodes: [FlowNodeStub({ id: 'composer', label: 'Composer', packages: ['web'] })],
      edges: [],
    }),
  ],
});

// Every flow operational: flowrider measures `runtime` alone, so it fans out to nothing, while
// siegemaster keeps a whole-quest scope for the off-map probe families.
const OPERATIONAL_QUEST = QuestStub({
  packagesAffected: [WEB_PACKAGE],
  flows: [
    FlowStub({
      id: 'register-lint-rule',
      name: 'Register rule',
      flowType: 'operational',
      nodes: [FlowNodeStub({ id: 'registered', label: 'Registered', packages: ['web'] })],
      edges: [],
    }),
  ],
});

describe('mintNextFamilyLayerBroker', () => {
  describe('a family that fans out to something', () => {
    it('VALID: {target: codeweaver, one package on one flow} => that family’s ONE cell', () => {
      const proxy = mintNextFamilyLayerBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      expect(
        mintNextFamilyLayerBroker({ quest: RUNTIME_QUEST, target: 'codeweaver' }),
      ).toStrictEqual([
        OperationItemStub({
          id: '00000000-0000-4000-8000-000000000001',
          role: 'codeweaver',
          text: 'Codeweaver: build this slice — package: web · flow: send-flow',
          status: 'pending',
          locked: false,
          flowIds: ['send-flow'],
          packageNames: ['web'],
        }),
      ]);
    });
  });

  describe('a family that fans out to nothing routes ON rather than stalling', () => {
    it('VALID: {target: flowrider, an all-operational quest} => siegemaster’s whole-quest scope instead', () => {
      const proxy = mintNextFamilyLayerBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      expect(
        mintNextFamilyLayerBroker({ quest: OPERATIONAL_QUEST, target: 'flowrider' }),
      ).toStrictEqual([
        OperationItemStub({
          id: '00000000-0000-4000-8000-000000000001',
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: register-lint-rule',
          status: 'pending',
          locked: true,
          flowIds: ['register-lint-rule'],
          // The spine fallback: a per-flow slice names no package of its own, so the scope inherits
          // every package the quest's nodes tag.
          packageNames: ['web'],
        }),
      ]);
    });
  });

  describe('targets that are not families', () => {
    it('EMPTY: {target: @complete} => mints nothing, because the run ended there', () => {
      const proxy = mintNextFamilyLayerBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      expect(
        mintNextFamilyLayerBroker({ quest: RUNTIME_QUEST, target: '@complete' }),
      ).toStrictEqual([]);
    });

    it('EMPTY: {target: @blocked} => mints nothing, because the quest halts for a human', () => {
      const proxy = mintNextFamilyLayerBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      expect(mintNextFamilyLayerBroker({ quest: RUNTIME_QUEST, target: '@blocked' })).toStrictEqual(
        [],
      );
    });

    it('EMPTY: {target naming no family on this quest type} => mints nothing', () => {
      const proxy = mintNextFamilyLayerBrokerProxy();
      proxy.setupUuids({ ids: UUIDS });

      expect(
        mintNextFamilyLayerBroker({ quest: RUNTIME_QUEST, target: 'retired-family' }),
      ).toStrictEqual([]);
    });
  });
});
