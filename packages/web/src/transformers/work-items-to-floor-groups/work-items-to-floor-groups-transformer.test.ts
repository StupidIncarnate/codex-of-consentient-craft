import { WorkItemStub } from '@dungeonmaster/shared/contracts';

import { workItemsToFloorGroupsTransformer } from './work-items-to-floor-groups-transformer';

describe('workItemsToFloorGroupsTransformer', () => {
  describe('happy path', () => {
    it('VALID: {linear chain chaos→pathseeker-surface→codeweaver→ward→siege→lawbringer→ward} => correct order and numbering', () => {
      const chaos = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const pathseeker = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'pathseeker-surface',
        status: 'complete',
        dependsOn: [chaos.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const cw1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [pathseeker.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const ward1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'ward',
        status: 'complete',
        dependsOn: [cw1.id],
        createdAt: '2024-01-15T10:03:00.000Z',
      });
      const siege = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000005',
        role: 'siegemaster',
        status: 'complete',
        dependsOn: [ward1.id],
        createdAt: '2024-01-15T10:04:00.000Z',
      });
      const lawbringer = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000006',
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [siege.id],
        createdAt: '2024-01-15T10:05:00.000Z',
      });
      const ward2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000007',
        role: 'ward',
        status: 'pending',
        dependsOn: [lawbringer.id],
        createdAt: '2024-01-15T10:06:00.000Z',
      });

      const items = [chaos, pathseeker, cw1, ward1, siege, lawbringer, ward2];
      const result = workItemsToFloorGroupsTransformer({ workItems: items });

      const floorNames = result.map((g) => g.floorName);

      expect(floorNames).toStrictEqual([
        'HOMEBASE',
        'ENTRANCE: MAPPING DUMPSTER',
        'FORGE',
        'MINI BOSS',
        'ARENA',
        'TRIBUNAL',
        'FLOOR BOSS',
      ]);
    });

    it('VALID: {linear chain} => correct floor numbering (null for entrances, sequential for floors)', () => {
      const chaos = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const pathseeker = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'pathseeker-surface',
        status: 'complete',
        dependsOn: [chaos.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const cw1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [pathseeker.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const ward1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'ward',
        status: 'complete',
        dependsOn: [cw1.id],
        createdAt: '2024-01-15T10:03:00.000Z',
      });
      const siege = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000005',
        role: 'siegemaster',
        status: 'complete',
        dependsOn: [ward1.id],
        createdAt: '2024-01-15T10:04:00.000Z',
      });
      const lawbringer = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000006',
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [siege.id],
        createdAt: '2024-01-15T10:05:00.000Z',
      });
      const ward2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000007',
        role: 'ward',
        status: 'pending',
        dependsOn: [lawbringer.id],
        createdAt: '2024-01-15T10:06:00.000Z',
      });

      const items = [chaos, pathseeker, cw1, ward1, siege, lawbringer, ward2];
      const result = workItemsToFloorGroupsTransformer({ workItems: items });

      const floorNumbers = result.map((g) => g.floorNumber);

      expect(floorNumbers).toStrictEqual([null, null, 1, 2, 3, 4, 5]);
    });
  });

  describe('parallel items', () => {
    it('VALID: {parallel codeweavers at same depth} => one FORGE floor', () => {
      const pathseeker = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'pathseeker-surface',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const cw1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [pathseeker.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const cw2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [pathseeker.id],
        createdAt: '2024-01-15T10:01:01.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [pathseeker, cw1, cw2] });

      const forgeGroups = result.filter((g) => g.floorName === 'FORGE');

      expect(forgeGroups.map((g) => g.workItems)).toStrictEqual([[cw1, cw2]]);
    });
  });

  describe('same role at different depths', () => {
    it('VALID: {pathseeker-surface at depth 0 and pathseeker-surface at depth 3} => separate entrance floors', () => {
      const ps1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'pathseeker-surface',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const cw = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [ps1.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const siege = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'siegemaster',
        status: 'failed',
        dependsOn: [cw.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const ps2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'pathseeker-surface',
        status: 'pending',
        dependsOn: [siege.id],
        createdAt: '2024-01-15T10:03:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [ps1, cw, siege, ps2] });

      const mappingDumpsterGroups = result.filter(
        (g) => g.floorName === 'ENTRANCE: MAPPING DUMPSTER',
      );

      expect(mappingDumpsterGroups.map((g) => g.workItems)).toStrictEqual([[ps1], [ps2]]);
    });
  });

  describe('skipped items', () => {
    it('VALID: {skipped items} => excluded from output', () => {
      const cw1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const cw2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'codeweaver',
        status: 'skipped',
        dependsOn: [],
        createdAt: '2024-01-15T10:01:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [cw1, cw2] });

      const totalItems = result.reduce((sum, g) => sum + g.workItems.length, 0);

      expect(totalItems).toBe(1);
    });

    it('VALID: {skipped items, includeSkipped: true} => skipped items retained in output', () => {
      const cw1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const cw2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'codeweaver',
        status: 'skipped',
        dependsOn: [],
        createdAt: '2024-01-15T10:01:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({
        workItems: [cw1, cw2],
        includeSkipped: true,
      });

      expect(result).toStrictEqual([
        {
          key: '0:FORGE',
          floorName: 'FORGE',
          floorNumber: 1,
          workItems: [cw1, cw2],
          startsNewGeneration: false,
        },
      ]);
    });
  });

  describe('merged floors', () => {
    it('VALID: {chaos + glyph at same depth} => one HOMEBASE group', () => {
      const chaos = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const glyph = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'glyphsmith',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:01.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [chaos, glyph] });

      const homebaseGroups = result.filter((g) => g.floorName === 'HOMEBASE');

      expect(homebaseGroups).toStrictEqual([
        {
          key: '0:HOMEBASE',
          floorName: 'HOMEBASE',
          floorNumber: null,
          workItems: [chaos, glyph],
          startsNewGeneration: false,
        },
      ]);
    });
  });

  describe('chaos only', () => {
    it('VALID: {chaos only, no glyph} => single HOMEBASE', () => {
      const chaos = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [chaos] });

      expect(result).toStrictEqual([
        {
          key: '0:HOMEBASE',
          floorName: 'HOMEBASE',
          floorNumber: null,
          workItems: [chaos],
          startsNewGeneration: false,
        },
      ]);
    });
  });

  describe('pathseeker entrance', () => {
    it('VALID: {pathseeker-surface} => ENTRANCE: MAPPING DUMPSTER with no floor number', () => {
      const ps = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'pathseeker-surface',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [ps] });

      expect(result[0]!.floorName).toBe('ENTRANCE: MAPPING DUMPSTER');
      expect(result[0]!.floorNumber).toBe(null);
    });
  });

  describe('ward floor name resolution', () => {
    it('VALID: {first ward depends on codeweavers} => MINI BOSS', () => {
      const cw = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const ward = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'ward',
        status: 'complete',
        dependsOn: [cw.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [cw, ward] });

      const wardGroup = result.find((g) => g.workItems.some((wi) => wi.role === 'ward'));

      expect(wardGroup!.floorName).toBe('MINI BOSS');
    });

    it('VALID: {ward depends on lawbringers} => FLOOR BOSS', () => {
      const lb = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'lawbringer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const ward = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'ward',
        status: 'pending',
        dependsOn: [lb.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [lb, ward] });

      const wardGroup = result.find((g) => g.workItems.some((wi) => wi.role === 'ward'));

      expect(wardGroup!.floorName).toBe('FLOOR BOSS');
    });

    it('VALID: {ward retry after spiritmender, root ward has codeweaver deps} => still MINI BOSS', () => {
      const cw = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const ward1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'ward',
        status: 'failed',
        dependsOn: [cw.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const spirit = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'spiritmender',
        status: 'complete',
        dependsOn: [ward1.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const ward2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'ward',
        status: 'pending',
        dependsOn: [spirit.id],
        insertedBy: ward1.id,
        createdAt: '2024-01-15T10:03:00.000Z',
      });

      const items = [cw, ward1, spirit, ward2];
      const result = workItemsToFloorGroupsTransformer({ workItems: items });

      const wardGroups = result.filter((g) => g.workItems.some((wi) => wi.role === 'ward'));

      expect(wardGroups[0]!.floorName).toBe('MINI BOSS');
      expect(wardGroups[1]!.floorName).toBe('MINI BOSS');
    });

    it('VALID: {floor boss ward retry, root has lawbringer deps via unfiltered set} => FLOOR BOSS', () => {
      const lb = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'lawbringer',
        status: 'skipped',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const ward1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'ward',
        status: 'failed',
        dependsOn: [lb.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const spirit = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'spiritmender',
        status: 'complete',
        dependsOn: [ward1.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const ward2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'ward',
        status: 'pending',
        dependsOn: [spirit.id],
        insertedBy: ward1.id,
        createdAt: '2024-01-15T10:03:00.000Z',
      });

      const allItems = [lb, ward1, spirit, ward2];
      const filteredItems = allItems.filter((wi) => wi.status !== 'skipped');
      const result = workItemsToFloorGroupsTransformer({
        workItems: filteredItems,
        allWorkItems: allItems,
      });

      const wardRetryGroup = result.find((g) => g.workItems.some((wi) => wi.id === ward2.id));

      expect(wardRetryGroup!.floorName).toBe('FLOOR BOSS');
    });
  });

  describe('spiritmender retry chain', () => {
    it('VALID: {spirit→ward fail→spirit→ward pass chain} => alternating MINI BOSS and INFIRMARY', () => {
      const cw = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const ward1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'ward',
        status: 'failed',
        dependsOn: [cw.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const spirit1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'spiritmender',
        status: 'complete',
        dependsOn: [ward1.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const ward2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'ward',
        status: 'failed',
        dependsOn: [spirit1.id],
        insertedBy: ward1.id,
        createdAt: '2024-01-15T10:03:00.000Z',
      });
      const spirit2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000005',
        role: 'spiritmender',
        status: 'complete',
        dependsOn: [ward2.id],
        createdAt: '2024-01-15T10:04:00.000Z',
      });
      const ward3 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000006',
        role: 'ward',
        status: 'complete',
        dependsOn: [spirit2.id],
        insertedBy: ward1.id,
        createdAt: '2024-01-15T10:05:00.000Z',
      });

      const items = [cw, ward1, spirit1, ward2, spirit2, ward3];
      const result = workItemsToFloorGroupsTransformer({ workItems: items });

      const floorNames = result.map((g) => g.floorName);

      expect(floorNames).toStrictEqual([
        'FORGE',
        'MINI BOSS',
        'INFIRMARY',
        'MINI BOSS',
        'INFIRMARY',
        'MINI BOSS',
      ]);

      const floorNumbers = result.map((g) => g.floorNumber);

      expect(floorNumbers).toStrictEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('full replan', () => {
    it('VALID: {siege fails, skipped items hidden, new chain} => sequential numbering across display', () => {
      const ps1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'pathseeker-surface',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const cw1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [ps1.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const ward1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'ward',
        status: 'complete',
        dependsOn: [cw1.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const siege1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'siegemaster',
        status: 'failed',
        dependsOn: [ward1.id],
        createdAt: '2024-01-15T10:03:00.000Z',
      });
      const skippedLb = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000005',
        role: 'lawbringer',
        status: 'skipped',
        dependsOn: [siege1.id],
        createdAt: '2024-01-15T10:04:00.000Z',
      });
      const skippedWard = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000006',
        role: 'ward',
        status: 'skipped',
        dependsOn: [skippedLb.id],
        createdAt: '2024-01-15T10:04:01.000Z',
      });
      const ps2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000007',
        role: 'pathseeker-surface',
        status: 'pending',
        dependsOn: [siege1.id],
        createdAt: '2024-01-15T10:05:00.000Z',
      });

      const allItems = [ps1, cw1, ward1, siege1, skippedLb, skippedWard, ps2];
      const result = workItemsToFloorGroupsTransformer({
        workItems: allItems,
        allWorkItems: allItems,
      });

      const skippedInOutput = result
        .flatMap((g) => g.workItems)
        .filter((wi) => wi.status === 'skipped');

      expect(skippedInOutput).toStrictEqual([]);
      expect(result[result.length - 1]!.floorName).toBe('ENTRANCE: MAPPING DUMPSTER');
      expect(result[result.length - 1]!.workItems[0]!.id).toBe(ps2.id);
    });
  });

  describe('codeweaver fails in slot manager', () => {
    it('VALID: {codeweaver fails, pathseeker-surface replan visible} => pathseeker-surface after codeweaver', () => {
      const ps1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'pathseeker-surface',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const cw = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'codeweaver',
        status: 'failed',
        dependsOn: [ps1.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const ps2 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'pathseeker-surface',
        status: 'in_progress',
        dependsOn: [cw.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [ps1, cw, ps2] });

      const forgeIdx = result.findIndex((g) => g.floorName === 'FORGE');
      const mappingDumpsterGroups = result.filter(
        (g) => g.floorName === 'ENTRANCE: MAPPING DUMPSTER',
      );

      expect(mappingDumpsterGroups.map((g) => g.workItems)).toStrictEqual([[ps1], [ps2]]);
      expect(mappingDumpsterGroups[1]!.workItems[0]!.dependsOn).toStrictEqual([cw.id]);

      const lastMappingDumpsterIdx = result.lastIndexOf(mappingDumpsterGroups[1]!);

      expect(lastMappingDumpsterIdx).toBeGreaterThan(forgeIdx);
    });
  });

  describe('lawbringer fails in slot manager', () => {
    it('VALID: {lawbringer fails, spiritmender visible} => spiritmender after lawbringer', () => {
      const lb = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'lawbringer',
        status: 'failed',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const spirit = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'spiritmender',
        status: 'in_progress',
        dependsOn: [lb.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [lb, spirit] });

      const tribunalIdx = result.findIndex((g) => g.floorName === 'TRIBUNAL');
      const infirmaryIdx = result.findIndex((g) => g.floorName === 'INFIRMARY');

      expect(infirmaryIdx).toBeGreaterThan(tribunalIdx);
      expect(result[infirmaryIdx]!.workItems[0]!.dependsOn).toStrictEqual([lb.id]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {workItems: []} => returns empty array', () => {
      const result = workItemsToFloorGroupsTransformer({ workItems: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('depth-0 ordering', () => {
    it('VALID: {chaos and pathseeker-surface both at depth 0} => chaos before pathseeker-surface by config order', () => {
      const chaos = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const ps = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'pathseeker-surface',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [ps, chaos] });

      expect(result[0]!.floorName).toBe('HOMEBASE');
      expect(result[1]!.floorName).toBe('ENTRANCE: MAPPING DUMPSTER');
    });
  });

  describe('non-existent deps', () => {
    it('EDGE: {item with deps pointing to non-existent IDs} => depth 0', () => {
      const item = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'codeweaver',
        status: 'pending',
        dependsOn: ['b0000000-0000-0000-0000-999999999999'],
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [item] });

      expect(result).toStrictEqual([
        {
          key: '0:FORGE',
          floorName: 'FORGE',
          floorNumber: 1,
          workItems: [item],
          startsNewGeneration: false,
        },
      ]);
    });
  });

  describe('hasWorkItemsOnly path', () => {
    it('VALID: {terminal quest work items, no steps} => correct floor groups', () => {
      const chaos = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const ps = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'pathseeker-surface',
        status: 'complete',
        dependsOn: [chaos.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [chaos, ps] });

      expect(result).toStrictEqual([
        {
          key: '0:HOMEBASE',
          floorName: 'HOMEBASE',
          floorNumber: null,
          workItems: [chaos],
          startsNewGeneration: false,
        },
        {
          key: '1:ENTRANCE: MAPPING DUMPSTER',
          floorName: 'ENTRANCE: MAPPING DUMPSTER',
          floorNumber: null,
          workItems: [ps],
          startsNewGeneration: false,
        },
      ]);
    });
  });

  describe('canonical pipeline ordering with two ward modes', () => {
    it('VALID: {chaos done + codeweaver, ward(changed), flowrider, siege, lawbringer, blightwarden, ward(full)} => canonical floor order with full ward LAST', () => {
      const chaos = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const codeweaver = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const wardChanged = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'ward',
        status: 'pending',
        wardMode: 'changed',
        dependsOn: [codeweaver.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const flowrider = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'flowrider',
        status: 'pending',
        dependsOn: [wardChanged.id],
        createdAt: '2024-01-15T10:03:00.000Z',
      });
      const siege = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000005',
        role: 'siegemaster',
        status: 'pending',
        dependsOn: [flowrider.id],
        createdAt: '2024-01-15T10:04:00.000Z',
      });
      const lawbringer = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000006',
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [siege.id],
        createdAt: '2024-01-15T10:05:00.000Z',
      });
      const blightwarden = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000007',
        role: 'blightwarden',
        status: 'pending',
        dependsOn: [lawbringer.id],
        createdAt: '2024-01-15T10:06:00.000Z',
      });
      const wardFull = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000008',
        role: 'ward',
        status: 'pending',
        wardMode: 'full',
        dependsOn: [blightwarden.id],
        createdAt: '2024-01-15T10:07:00.000Z',
      });

      const items = [
        chaos,
        codeweaver,
        wardChanged,
        flowrider,
        siege,
        lawbringer,
        blightwarden,
        wardFull,
      ];
      const result = workItemsToFloorGroupsTransformer({ workItems: items });

      const floorNames = result.map((g) => g.floorName);

      expect(floorNames).toStrictEqual([
        'HOMEBASE',
        'FORGE',
        'MINI BOSS',
        'GLUEWORKS',
        'ARENA',
        'TRIBUNAL',
        'QUARANTINE',
        'FLOOR BOSS',
      ]);

      const flowriderIdx = result.findIndex((g) => g.floorName === 'GLUEWORKS');
      const forgeIdx = result.findIndex((g) => g.floorName === 'FORGE');
      const floorBossIdx = result.findIndex((g) => g.floorName === 'FLOOR BOSS');
      const blightwardenIdx = result.findIndex((g) => g.floorName === 'QUARANTINE');

      expect(flowriderIdx).toBeGreaterThan(forgeIdx);
      expect(floorBossIdx).toBeGreaterThan(blightwardenIdx);
      expect(floorBossIdx).toBe(result.length - 1);
    });

    it('VALID: {flat pipeline all at depth 0 — ward(changed), ward(full), flowrider, codeweaver} => full ward sorts after changed ward and flowrider after codeweaver', () => {
      const codeweaver = WorkItemStub({
        id: 'b0000000-0000-0000-0000-000000000001',
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const wardChanged = WorkItemStub({
        id: 'b0000000-0000-0000-0000-000000000002',
        role: 'ward',
        status: 'pending',
        wardMode: 'changed',
        dependsOn: [],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const flowrider = WorkItemStub({
        id: 'b0000000-0000-0000-0000-000000000003',
        role: 'flowrider',
        status: 'pending',
        dependsOn: [],
        createdAt: '2024-01-15T10:03:00.000Z',
      });
      const wardFull = WorkItemStub({
        id: 'b0000000-0000-0000-0000-000000000004',
        role: 'ward',
        status: 'pending',
        wardMode: 'full',
        dependsOn: [],
        createdAt: '2024-01-15T10:04:00.000Z',
      });

      const items = [wardFull, flowrider, wardChanged, codeweaver];
      const result = workItemsToFloorGroupsTransformer({ workItems: items });

      const floorNames = result.map((g) => g.floorName);

      expect(floorNames).toStrictEqual(['FORGE', 'MINI BOSS', 'GLUEWORKS', 'FLOOR BOSS']);
    });
  });

  describe('pathseeker entrance collapse', () => {
    it('VALID: {chaos + 4 pathseeker-* split roles at depths 0/1/2/2/3} => one ENTRANCE: MAPPING DUMPSTER group with all 4 items in topological order', () => {
      const chaos = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const psSurface = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'pathseeker-surface',
        status: 'pending',
        dependsOn: [chaos.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const psDedup = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'pathseeker-dedup',
        status: 'pending',
        dependsOn: [psSurface.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const psAssertionCorrectness = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'pathseeker-assertion-correctness',
        status: 'pending',
        dependsOn: [psSurface.id],
        createdAt: '2024-01-15T10:02:01.000Z',
      });
      const psWalk = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000005',
        role: 'pathseeker-walk',
        status: 'pending',
        dependsOn: [psDedup.id, psAssertionCorrectness.id],
        createdAt: '2024-01-15T10:03:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({
        workItems: [chaos, psSurface, psDedup, psAssertionCorrectness, psWalk],
      });

      const mappingDumpsterGroups = result.filter(
        (g) => g.floorName === 'ENTRANCE: MAPPING DUMPSTER',
      );

      expect(mappingDumpsterGroups.map((g) => g.workItems)).toStrictEqual([
        [psSurface, psDedup, psAssertionCorrectness, psWalk],
      ]);
      expect(mappingDumpsterGroups[0]!.floorNumber).toBe(null);
    });

    it('VALID: {pathseeker phase 1 complete + forge + ward + pathseeker phase 2 re-summon} => two distinct ENTRANCE: MAPPING DUMPSTER groups with FORGE/MINI BOSS between them', () => {
      const chaos = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const ps1Surface = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'pathseeker-surface',
        status: 'complete',
        dependsOn: [chaos.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const ps1Dedup = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000003',
        role: 'pathseeker-dedup',
        status: 'complete',
        dependsOn: [ps1Surface.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const ps1AssertionCorrectness = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000004',
        role: 'pathseeker-assertion-correctness',
        status: 'complete',
        dependsOn: [ps1Surface.id],
        createdAt: '2024-01-15T10:02:01.000Z',
      });
      const ps1Walk = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000005',
        role: 'pathseeker-walk',
        status: 'complete',
        dependsOn: [ps1Dedup.id, ps1AssertionCorrectness.id],
        createdAt: '2024-01-15T10:03:00.000Z',
      });
      const cw = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000006',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [ps1Walk.id],
        createdAt: '2024-01-15T10:04:00.000Z',
      });
      const ward = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000007',
        role: 'ward',
        status: 'failed',
        dependsOn: [cw.id],
        createdAt: '2024-01-15T10:05:00.000Z',
      });
      const ps2Surface = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000008',
        role: 'pathseeker-surface',
        status: 'pending',
        dependsOn: [ward.id],
        createdAt: '2024-01-15T10:06:00.000Z',
      });
      const ps2Dedup = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000009',
        role: 'pathseeker-dedup',
        status: 'pending',
        dependsOn: [ps2Surface.id],
        createdAt: '2024-01-15T10:07:00.000Z',
      });
      const ps2AssertionCorrectness = WorkItemStub({
        id: 'a0000000-0000-0000-0000-00000000000a',
        role: 'pathseeker-assertion-correctness',
        status: 'pending',
        dependsOn: [ps2Surface.id],
        createdAt: '2024-01-15T10:07:01.000Z',
      });
      const ps2Walk = WorkItemStub({
        id: 'a0000000-0000-0000-0000-00000000000b',
        role: 'pathseeker-walk',
        status: 'pending',
        dependsOn: [ps2Dedup.id, ps2AssertionCorrectness.id],
        createdAt: '2024-01-15T10:08:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({
        workItems: [
          chaos,
          ps1Surface,
          ps1Dedup,
          ps1AssertionCorrectness,
          ps1Walk,
          cw,
          ward,
          ps2Surface,
          ps2Dedup,
          ps2AssertionCorrectness,
          ps2Walk,
        ],
      });

      const floorNames = result.map((g) => g.floorName);

      expect(floorNames).toStrictEqual([
        'HOMEBASE',
        'ENTRANCE: MAPPING DUMPSTER',
        'FORGE',
        'MINI BOSS',
        'ENTRANCE: MAPPING DUMPSTER',
      ]);

      const mappingDumpsterGroups = result.filter(
        (g) => g.floorName === 'ENTRANCE: MAPPING DUMPSTER',
      );

      expect(mappingDumpsterGroups.map((g) => g.workItems)).toStrictEqual([
        [ps1Surface, ps1Dedup, ps1AssertionCorrectness, ps1Walk],
        [ps2Surface, ps2Dedup, ps2AssertionCorrectness, ps2Walk],
      ]);
    });
  });

  describe('bare pathseeker replan (generation re-entry)', () => {
    it('VALID: {original bare pathseeker, no replan} => merges into HOMEBASE, FORGE is FLOOR 1, no divider', () => {
      const chaos = WorkItemStub({
        id: 'c0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const ps = WorkItemStub({
        id: 'c0000000-0000-0000-0000-000000000002',
        role: 'pathseeker',
        status: 'complete',
        dependsOn: [chaos.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const cw = WorkItemStub({
        id: 'c0000000-0000-0000-0000-000000000003',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [ps.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const ward = WorkItemStub({
        id: 'c0000000-0000-0000-0000-000000000004',
        role: 'ward',
        status: 'pending',
        wardMode: 'changed',
        dependsOn: [cw.id],
        createdAt: '2024-01-15T10:03:00.000Z',
      });

      const items = [chaos, ps, cw, ward];
      const result = workItemsToFloorGroupsTransformer({ workItems: items, allWorkItems: items });

      expect({
        floorNames: result.map((g) => g.floorName),
        floorNumbers: result.map((g) => g.floorNumber),
        dividers: result.map((g) => g.startsNewGeneration),
      }).toStrictEqual({
        floorNames: ['HOMEBASE', 'FORGE', 'MINI BOSS'],
        floorNumbers: [null, 1, 2],
        dividers: [false, false, false],
      });
    });

    it('VALID: {blightwarden failed → bare pathseeker replan + regenerated chain} => divider + HOMEBASE re-entry + FLOOR count restarts at 1', () => {
      const chaos = WorkItemStub({
        id: 'd0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const ps1 = WorkItemStub({
        id: 'd0000000-0000-0000-0000-000000000002',
        role: 'pathseeker',
        status: 'complete',
        dependsOn: [chaos.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const cw1 = WorkItemStub({
        id: 'd0000000-0000-0000-0000-000000000003',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [ps1.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const ward1 = WorkItemStub({
        id: 'd0000000-0000-0000-0000-000000000004',
        role: 'ward',
        status: 'complete',
        wardMode: 'changed',
        dependsOn: [cw1.id],
        createdAt: '2024-01-15T10:03:00.000Z',
      });
      const blight = WorkItemStub({
        id: 'd0000000-0000-0000-0000-000000000005',
        role: 'blightwarden',
        status: 'failed',
        dependsOn: [ward1.id],
        createdAt: '2024-01-15T10:04:00.000Z',
      });
      const ps2 = WorkItemStub({
        id: 'd0000000-0000-0000-0000-000000000006',
        role: 'pathseeker',
        status: 'pending',
        dependsOn: [],
        insertedBy: blight.id,
        createdAt: '2024-01-15T10:05:00.000Z',
      });
      const cw2 = WorkItemStub({
        id: 'd0000000-0000-0000-0000-000000000007',
        role: 'codeweaver',
        status: 'pending',
        dependsOn: [ps2.id],
        createdAt: '2024-01-15T10:06:00.000Z',
      });
      const ward2 = WorkItemStub({
        id: 'd0000000-0000-0000-0000-000000000008',
        role: 'ward',
        status: 'pending',
        wardMode: 'changed',
        dependsOn: [cw2.id],
        createdAt: '2024-01-15T10:07:00.000Z',
      });

      const items = [chaos, ps1, cw1, ward1, blight, ps2, cw2, ward2];
      const result = workItemsToFloorGroupsTransformer({ workItems: items, allWorkItems: items });

      expect({
        floorNames: result.map((g) => g.floorName),
        floorNumbers: result.map((g) => g.floorNumber),
        dividers: result.map((g) => g.startsNewGeneration),
      }).toStrictEqual({
        floorNames: [
          'HOMEBASE',
          'FORGE',
          'MINI BOSS',
          'QUARANTINE',
          'HOMEBASE',
          'FORGE',
          'MINI BOSS',
        ],
        floorNumbers: [null, 1, 2, 3, null, 1, 2],
        dividers: [false, false, false, false, true, false, false],
      });
    });

    it('VALID: {replan pathseeker only, downstream not yet regenerated} => last group is HOMEBASE with a divider and no floor number', () => {
      const chaos = WorkItemStub({
        id: 'e0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const cw1 = WorkItemStub({
        id: 'e0000000-0000-0000-0000-000000000002',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [chaos.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const blight = WorkItemStub({
        id: 'e0000000-0000-0000-0000-000000000003',
        role: 'blightwarden',
        status: 'failed',
        dependsOn: [cw1.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });
      const ps2 = WorkItemStub({
        id: 'e0000000-0000-0000-0000-000000000004',
        role: 'pathseeker',
        status: 'pending',
        dependsOn: [],
        insertedBy: blight.id,
        createdAt: '2024-01-15T10:03:00.000Z',
      });

      const items = [chaos, cw1, blight, ps2];
      const result = workItemsToFloorGroupsTransformer({ workItems: items, allWorkItems: items });
      const lastGroup = result[result.length - 1]!;

      expect({
        floorName: lastGroup.floorName,
        floorNumber: lastGroup.floorNumber,
        startsNewGeneration: lastGroup.startsNewGeneration,
        onlyItemIsReplan: lastGroup.workItems.map((wi) => wi.id),
      }).toStrictEqual({
        floorName: 'HOMEBASE',
        floorNumber: null,
        startsNewGeneration: true,
        onlyItemIsReplan: [ps2.id],
      });
    });
  });
});
