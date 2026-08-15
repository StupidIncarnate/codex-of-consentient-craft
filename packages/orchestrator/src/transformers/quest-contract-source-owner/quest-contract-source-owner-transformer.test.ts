import {
  QuestContractEntryStub,
  QuestContractPropertyStub,
  QuestPackageEntryStub,
} from '@dungeonmaster/shared/contracts';

import { questContractSourceOwnerTransformer } from './quest-contract-source-owner-transformer';

const SHARED_ENTRY = QuestPackageEntryStub({
  name: 'shared',
  location: './packages/shared',
  packageType: 'library',
});
const WEB_ENTRY = QuestPackageEntryStub({
  name: 'web',
  location: './packages/web',
  packageType: 'frontend-react',
});
// Declared inside web's tree, so the longest-prefix rule decides which of the two owns a path
// under it — the same decision the derived ledger makes when it mints the foundation item.
const NESTED_CHART_ENTRY = QuestPackageEntryStub({
  name: 'chart',
  location: './packages/web/plugins/chart',
  packageType: 'library',
});

const FANOUT_CONTRACT = QuestContractEntryStub({
  id: 'status-keyed-statics-fanout',
  name: 'StatusKeyedStaticsFanout',
  status: 'modified',
  source: 'packages/shared/src/statics/hydrate-strategy/hydrate-strategy-statics.ts',
  properties: [
    {
      name: 'questHydrateStrategyStatics.strategies',
      type: 'HydrateStrategyMap',
      description: 'Both new statuses need an entry or the key-set equality test fails',
    },
  ],
});

describe('questContractSourceOwnerTransformer', () => {
  describe('the contract itself', () => {
    it('VALID: {no property, source under a declared location} => returns that package', () => {
      const owner = questContractSourceOwnerTransformer({
        contract: FANOUT_CONTRACT,
        packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
      });

      expect(String(owner)).toBe('shared');
    });

    it('INVALID: {no property, source under no declared location} => returns undefined, so the gate refuses exactly what the generator would drop', () => {
      const owner = questContractSourceOwnerTransformer({
        contract: FANOUT_CONTRACT,
        packagesAffected: [WEB_ENTRY],
      });

      expect(owner).toBe(undefined);
    });
  });

  describe('one property of it', () => {
    it("VALID: {a property with no source of its own} => it lives in the contract's file and resolves with it", () => {
      const property = QuestContractPropertyStub({
        name: 'questHydrateStrategyStatics.strategies',
        type: 'HydrateStrategyMap',
        description: 'Both new statuses need an entry or the key-set equality test fails',
      });

      const owner = questContractSourceOwnerTransformer({
        contract: FANOUT_CONTRACT,
        property,
        packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
      });

      expect(String(owner)).toBe('shared');
    });

    it('VALID: {a property declaring a source in another package} => it resolves to THAT package, not the contract’s', () => {
      const property = QuestContractPropertyStub({
        name: 'questGateSectionsStatics.sections',
        type: 'GateSectionMap',
        description: 'Sixteen literal keys read by index with a QuestStatus',
        source: 'packages/web/src/statics/quest-gate-sections/quest-gate-sections-statics.ts',
      });

      const owner = questContractSourceOwnerTransformer({
        contract: FANOUT_CONTRACT,
        property,
        packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
      });

      expect(String(owner)).toBe('web');
    });

    it('VALID: {a property source under a package declared INSIDE another} => the longest declared prefix wins, exactly as a contract source does', () => {
      const property = QuestContractPropertyStub({
        name: 'points',
        type: 'SeriesPoints',
        description: 'The plotted points',
        source: 'packages/web/plugins/chart/src/contracts/points/points-contract.ts',
      });

      const owner = questContractSourceOwnerTransformer({
        contract: FANOUT_CONTRACT,
        property,
        packagesAffected: [SHARED_ENTRY, WEB_ENTRY, NESTED_CHART_ENTRY],
      });

      expect(String(owner)).toBe('chart');
    });

    it('INVALID: {a property source under no declared location while the contract resolves} => returns undefined for the property alone', () => {
      const property = QuestContractPropertyStub({
        name: 'questGateSectionsStatics.sections',
        type: 'GateSectionMap',
        description: 'Sixteen literal keys read by index with a QuestStatus',
        source: 'packages/cli/src/statics/quest-gate-sections/quest-gate-sections-statics.ts',
      });

      expect({
        contractOwner: String(
          questContractSourceOwnerTransformer({
            contract: FANOUT_CONTRACT,
            packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
          }),
        ),
        propertyOwner: questContractSourceOwnerTransformer({
          contract: FANOUT_CONTRACT,
          property,
          packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
        }),
      }).toStrictEqual({ contractOwner: 'shared', propertyOwner: undefined });
    });
  });
});
