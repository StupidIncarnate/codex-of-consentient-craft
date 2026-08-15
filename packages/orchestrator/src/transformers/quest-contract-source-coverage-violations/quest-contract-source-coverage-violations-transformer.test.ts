import { QuestContractEntryStub, QuestPackageEntryStub } from '@dungeonmaster/shared/contracts';
import { packageForPathTransformer } from '@dungeonmaster/shared/transformers';

import { questContractSourceCoverageViolationsTransformer } from './quest-contract-source-coverage-violations-transformer';

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

describe('questContractSourceCoverageViolationsTransformer', () => {
  describe('sources that route', () => {
    it("VALID: {a 'new' contract whose source sits under a declared location} => returns no violations", () => {
      const contract = QuestContractEntryStub({
        id: 'session-token',
        name: 'SessionToken',
        status: 'new',
        source: 'packages/shared/src/contracts/session-token/session-token-contract.ts',
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [contract],
        packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
      });

      expect(offenders).toStrictEqual([]);
    });

    it("VALID: {a 'modified' contract whose source sits under a declared location} => returns no violations", () => {
      const contract = QuestContractEntryStub({
        id: 'quest-status',
        name: 'QuestStatus',
        status: 'modified',
        source: 'packages/shared/src/contracts/quest-status/quest-status-contract.ts',
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [contract],
        packagesAffected: [SHARED_ENTRY],
      });

      expect(offenders).toStrictEqual([]);
    });

    it('EMPTY: {contracts: []} => returns no violations', () => {
      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [],
        packagesAffected: [SHARED_ENTRY],
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('refuses by name', () => {
    it("INVALID: {a 'new' contract whose source sits under no declared location} => names the contract, its source, and every way to fix it", () => {
      const contract = QuestContractEntryStub({
        id: 'session-token',
        name: 'SessionToken',
        status: 'new',
        source: 'packages/cli/src/contracts/session-token/session-token-contract.ts',
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [contract],
        packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Contract 'SessionToken' declares source 'packages/cli/src/contracts/session-token/session-token-contract.ts', which sits under no package in quest.packagesAffected. The implementation ledger mints each package's foundation item from these paths, so a contract resolving nowhere reaches no session at all. Point source at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or mark the contract status 'existing' if the quest only references it.",
      ]);
    });

    it("INVALID: {a 'modified' contract whose source sits under no declared location} => refuses it too, not just new ones", () => {
      const contract = QuestContractEntryStub({
        id: 'ward-mode',
        name: 'WardMode',
        status: 'modified',
        source: 'packages/ward/src/contracts/ward-mode/ward-mode-contract.ts',
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [contract],
        packagesAffected: [SHARED_ENTRY],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Contract 'WardMode' declares source 'packages/ward/src/contracts/ward-mode/ward-mode-contract.ts', which sits under no package in quest.packagesAffected. The implementation ledger mints each package's foundation item from these paths, so a contract resolving nowhere reaches no session at all. Point source at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or mark the contract status 'existing' if the quest only references it.",
      ]);
    });

    it('EMPTY: {packagesAffected: [] with one new contract} => every source resolves nowhere', () => {
      const contract = QuestContractEntryStub({
        id: 'session-token',
        name: 'SessionToken',
        status: 'new',
        source: 'packages/shared/src/contracts/session-token/session-token-contract.ts',
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [contract],
        packagesAffected: [],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Contract 'SessionToken' declares source 'packages/shared/src/contracts/session-token/session-token-contract.ts', which sits under no package in quest.packagesAffected. The implementation ledger mints each package's foundation item from these paths, so a contract resolving nowhere reaches no session at all. Point source at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or mark the contract status 'existing' if the quest only references it.",
      ]);
    });

    it('INVALID: {two offenders among three contracts} => reports both, in ledger order, and passes the one that routes', () => {
      const routes = QuestContractEntryStub({
        id: 'session-token',
        name: 'SessionToken',
        status: 'new',
        source: 'packages/shared/src/contracts/session-token/session-token-contract.ts',
      });
      const firstOffender = QuestContractEntryStub({
        id: 'ward-mode',
        name: 'WardMode',
        status: 'new',
        source: 'packages/ward/src/contracts/ward-mode/ward-mode-contract.ts',
      });
      const secondOffender = QuestContractEntryStub({
        id: 'hook-event',
        name: 'HookEvent',
        status: 'modified',
        source: 'packages/hooks/src/contracts/hook-event/hook-event-contract.ts',
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [firstOffender, routes, secondOffender],
        packagesAffected: [SHARED_ENTRY],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Contract 'WardMode' declares source 'packages/ward/src/contracts/ward-mode/ward-mode-contract.ts', which sits under no package in quest.packagesAffected. The implementation ledger mints each package's foundation item from these paths, so a contract resolving nowhere reaches no session at all. Point source at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or mark the contract status 'existing' if the quest only references it.",
        "Contract 'HookEvent' declares source 'packages/hooks/src/contracts/hook-event/hook-event-contract.ts', which sits under no package in quest.packagesAffected. The implementation ledger mints each package's foundation item from these paths, so a contract resolving nowhere reaches no session at all. Point source at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or mark the contract status 'existing' if the quest only references it.",
      ]);
    });
  });

  describe('property-level sources', () => {
    // A contract's own `source` is one-to-one, but a contract is one-to-many: a property may name
    // a file in another package, and the derived ledger routes it there. The gate has to refuse an
    // unroutable property path for the same reason it refuses an unroutable contract path — the
    // foundation item that property should have landed in never exists.
    it('VALID: {a property source under a second declared location} => returns no violations', () => {
      const contract = QuestContractEntryStub({
        id: 'status-keyed-statics-fanout',
        name: 'StatusKeyedStaticsFanout',
        status: 'modified',
        source: 'packages/shared/src/statics/hydrate-strategy/hydrate-strategy-statics.ts',
        properties: [
          {
            name: 'questGateSectionsStatics.sections',
            type: 'GateSectionMap',
            description: 'Sixteen literal keys read by index with a QuestStatus',
            source: 'packages/web/src/statics/quest-gate-sections/quest-gate-sections-statics.ts',
          },
        ],
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [contract],
        packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {a property source under no declared location} => names the property as well as the contract', () => {
      const contract = QuestContractEntryStub({
        id: 'status-keyed-statics-fanout',
        name: 'StatusKeyedStaticsFanout',
        status: 'modified',
        source: 'packages/shared/src/statics/hydrate-strategy/hydrate-strategy-statics.ts',
        properties: [
          {
            name: 'questGateSectionsStatics.sections',
            type: 'GateSectionMap',
            description: 'Sixteen literal keys read by index with a QuestStatus',
            source: 'packages/cli/src/statics/quest-gate-sections/quest-gate-sections-statics.ts',
          },
        ],
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [contract],
        packagesAffected: [SHARED_ENTRY, WEB_ENTRY],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Contract 'StatusKeyedStaticsFanout' property 'questGateSectionsStatics.sections' declares source 'packages/cli/src/statics/quest-gate-sections/quest-gate-sections-statics.ts', which sits under no package in quest.packagesAffected. A property carrying its own source is how one contract delivers into several packages, so a property resolving nowhere reaches no session at all. Point it at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or drop the property source so it falls back to the contract's.",
      ]);
    });

    it("VALID: {a property with no source of its own} => nothing extra is checked, because it inherits the contract's", () => {
      const contract = QuestContractEntryStub({
        id: 'session-token',
        name: 'SessionToken',
        status: 'new',
        source: 'packages/shared/src/contracts/session-token/session-token-contract.ts',
        properties: [
          {
            name: 'value',
            type: 'SessionTokenValue',
            description: 'The signed token, opaque to the browser',
          },
        ],
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [contract],
        packagesAffected: [SHARED_ENTRY],
      });

      expect(offenders).toStrictEqual([]);
    });

    it("INVALID: {an 'existing' contract whose property source resolves nowhere} => still exempt, exactly as its own source is", () => {
      const contract = QuestContractEntryStub({
        id: 'quest-status',
        name: 'QuestStatus',
        status: 'existing',
        source: 'packages/shared/src/contracts/quest-status/quest-status-contract.ts',
        properties: [
          {
            name: 'status',
            type: 'QuestStatusValue',
            description: 'Gains the merging member',
            source: 'packages/cli/src/contracts/quest-status/quest-status-contract.ts',
          },
        ],
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [contract],
        packagesAffected: [SHARED_ENTRY],
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe("'existing' contracts are exempt", () => {
    // Reference material the spec points at, not work the quest performs — it mints no foundation
    // item, so refusing it would force a packagesAffected entry for a package nobody will touch.
    it("VALID: {an 'existing' contract whose source sits under no declared location} => returns no violations", () => {
      const contract = QuestContractEntryStub({
        id: 'quest-status',
        name: 'QuestStatus',
        status: 'existing',
        source: 'packages/cli/src/contracts/quest-status/quest-status-contract.ts',
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [contract],
        packagesAffected: [SHARED_ENTRY],
      });

      expect(offenders).toStrictEqual([]);
    });

    it("VALID: {an unroutable 'existing' contract beside an unroutable 'new' one} => only the new one is refused", () => {
      const reference = QuestContractEntryStub({
        id: 'quest-status',
        name: 'QuestStatus',
        status: 'existing',
        source: 'packages/cli/src/contracts/quest-status/quest-status-contract.ts',
      });
      const work = QuestContractEntryStub({
        id: 'ward-mode',
        name: 'WardMode',
        status: 'new',
        source: 'packages/ward/src/contracts/ward-mode/ward-mode-contract.ts',
      });

      const offenders = questContractSourceCoverageViolationsTransformer({
        contracts: [reference, work],
        packagesAffected: [SHARED_ENTRY],
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Contract 'WardMode' declares source 'packages/ward/src/contracts/ward-mode/ward-mode-contract.ts', which sits under no package in quest.packagesAffected. The implementation ledger mints each package's foundation item from these paths, so a contract resolving nowhere reaches no session at all. Point source at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or mark the contract status 'existing' if the quest only references it.",
      ]);
    });
  });

  describe('agrees with packageForPathTransformer, the generator that mints the foundation item', () => {
    // The gate and the generator read the SAME resolution. A divergence would refuse work that
    // does route, or pass work that does not, so both are asserted in one breath here.
    it('VALID: {a source under a nested declared package} => the generator resolves it to the inner package and the gate passes it', () => {
      const source = 'packages/web/plugins/chart/src/contracts/series/series-contract.ts';
      const packagesAffected = [WEB_ENTRY, NESTED_CHART_ENTRY];
      const contract = QuestContractEntryStub({
        id: 'series',
        name: 'Series',
        status: 'new',
        source,
      });

      expect({
        mintsFoundationItemFor: String(
          packageForPathTransformer({ path: source, packagesAffected }),
        ),
        violations: questContractSourceCoverageViolationsTransformer({
          contracts: [contract],
          packagesAffected,
        }).map((offender) => String(offender)),
      }).toStrictEqual({ mintsFoundationItemFor: 'chart', violations: [] });
    });

    it('INVALID: {a source a sibling directory only appears to cover} => the generator resolves nothing and the gate refuses it', () => {
      const source = 'packages/web-extra/src/contracts/series/series-contract.ts';
      const packagesAffected = [WEB_ENTRY];
      const contract = QuestContractEntryStub({
        id: 'series',
        name: 'Series',
        status: 'new',
        source,
      });

      expect({
        mintsFoundationItemFor: String(
          packageForPathTransformer({ path: source, packagesAffected }),
        ),
        violations: questContractSourceCoverageViolationsTransformer({
          contracts: [contract],
          packagesAffected,
        }).map((offender) => String(offender)),
      }).toStrictEqual({
        mintsFoundationItemFor: 'undefined',
        violations: [
          "Contract 'Series' declares source 'packages/web-extra/src/contracts/series/series-contract.ts', which sits under no package in quest.packagesAffected. The implementation ledger mints each package's foundation item from these paths, so a contract resolving nowhere reaches no session at all. Point source at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or mark the contract status 'existing' if the quest only references it.",
        ],
      });
    });
  });
});
