import { WorkItemStub } from '@dungeonmaster/shared/contracts';

import { workItemsToFloorGroupsTransformer } from './work-items-to-floor-groups-transformer';

describe('workItemsToFloorGroupsTransformer', () => {
  describe('happy path', () => {
    it('VALID: {linear chain chaos→pathseeker→codeweaver→ward→siege→lawbringer→ward} => correct order and numbering', () => {
      const chaos = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const pathseeker = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'pathseeker',
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
        'ENTRANCE: CARTOGRAPHY',
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
        role: 'pathseeker',
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
        role: 'pathseeker',
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
    it('VALID: {pathseeker at depth 0 and pathseeker at depth 3} => separate floors', () => {
      const ps1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'pathseeker',
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
        role: 'pathseeker',
        status: 'pending',
        dependsOn: [siege.id],
        createdAt: '2024-01-15T10:03:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [ps1, cw, siege, ps2] });

      const cartographyGroups = result.filter((g) => g.floorName === 'ENTRANCE: CARTOGRAPHY');

      expect(cartographyGroups.map((g) => g.workItems)).toStrictEqual([[ps1], [ps2]]);
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
          floorName: 'HOMEBASE',
          floorNumber: null,
          workItems: [chaos, glyph],
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
          floorName: 'HOMEBASE',
          floorNumber: null,
          workItems: [chaos],
        },
      ]);
    });
  });

  describe('pathseeker entrance', () => {
    it('VALID: {pathseeker} => ENTRANCE: CARTOGRAPHY with no floor number', () => {
      const ps = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'pathseeker',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [ps] });

      expect(result[0]!.floorName).toBe('ENTRANCE: CARTOGRAPHY');
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
        role: 'pathseeker',
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
        role: 'pathseeker',
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
      expect(result[result.length - 1]!.floorName).toBe('ENTRANCE: CARTOGRAPHY');
      expect(result[result.length - 1]!.workItems[0]!.id).toBe(ps2.id);
    });
  });

  describe('codeweaver fails in slot manager', () => {
    it('VALID: {codeweaver fails, pathseeker replan visible} => pathseeker after codeweaver', () => {
      const ps1 = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'pathseeker',
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
        role: 'pathseeker',
        status: 'in_progress',
        dependsOn: [cw.id],
        createdAt: '2024-01-15T10:02:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [ps1, cw, ps2] });

      const forgeIdx = result.findIndex((g) => g.floorName === 'FORGE');
      const cartographyGroups = result.filter((g) => g.floorName === 'ENTRANCE: CARTOGRAPHY');

      expect(cartographyGroups.map((g) => g.workItems)).toStrictEqual([[ps1], [ps2]]);
      expect(cartographyGroups[1]!.workItems[0]!.dependsOn).toStrictEqual([cw.id]);

      const lastCartoIdx = result.lastIndexOf(cartographyGroups[1]!);

      expect(lastCartoIdx).toBeGreaterThan(forgeIdx);
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
    it('VALID: {chaos and pathseeker both at depth 0} => chaos before pathseeker by config order', () => {
      const chaos = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:01:00.000Z',
      });
      const ps = WorkItemStub({
        id: 'a0000000-0000-0000-0000-000000000002',
        role: 'pathseeker',
        status: 'complete',
        dependsOn: [],
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [ps, chaos] });

      expect(result[0]!.floorName).toBe('HOMEBASE');
      expect(result[1]!.floorName).toBe('ENTRANCE: CARTOGRAPHY');
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
          floorName: 'FORGE',
          floorNumber: 1,
          workItems: [item],
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
        role: 'pathseeker',
        status: 'complete',
        dependsOn: [chaos.id],
        createdAt: '2024-01-15T10:01:00.000Z',
      });

      const result = workItemsToFloorGroupsTransformer({ workItems: [chaos, ps] });

      expect(result).toStrictEqual([
        {
          floorName: 'HOMEBASE',
          floorNumber: null,
          workItems: [chaos],
        },
        {
          floorName: 'ENTRANCE: CARTOGRAPHY',
          floorNumber: null,
          workItems: [ps],
        },
      ]);
    });
  });
});
