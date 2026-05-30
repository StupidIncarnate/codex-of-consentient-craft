import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';
import { questBuildBugHuntGraphBroker } from './quest-build-bug-hunt-graph-broker';
import { questBuildBugHuntGraphBrokerProxy } from './quest-build-bug-hunt-graph-broker.proxy';

const NOW = IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' });

const UUIDS = [
  'aaaaaaaa-1111-4222-9333-444444444444',
  'bbbbbbbb-1111-4222-9333-444444444444',
  'cccccccc-1111-4222-9333-444444444444',
  'dddddddd-1111-4222-9333-444444444444',
  'eeeeeeee-1111-4222-9333-444444444444',
] as const;

describe('questBuildBugHuntGraphBroker', () => {
  it('VALID: {priorWorkItemIds: []} => 5 items: pesteater, ward, lawbringer, blightwarden, ward', () => {
    const proxy = questBuildBugHuntGraphBrokerProxy();
    proxy.setupUuidQueue({ uuids: UUIDS });

    const result = questBuildBugHuntGraphBroker({ priorWorkItemIds: [], now: NOW });

    const roles = result.map((wi) => wi.role);

    expect(roles).toStrictEqual(['pesteater', 'ward', 'lawbringer', 'blightwarden', 'ward']);
  });

  it('VALID: {priorWorkItemIds: []} => items are dependency-chained in order', () => {
    const proxy = questBuildBugHuntGraphBrokerProxy();
    proxy.setupUuidQueue({ uuids: UUIDS });

    const result = questBuildBugHuntGraphBroker({ priorWorkItemIds: [], now: NOW });

    const [pesteater, wardChanged, lawbringer, blightwarden, wardFull] = result;

    expect(pesteater?.dependsOn).toStrictEqual([]);
    expect(wardChanged?.dependsOn).toStrictEqual([pesteater?.id]);
    expect(lawbringer?.dependsOn).toStrictEqual([wardChanged?.id]);
    expect(blightwarden?.dependsOn).toStrictEqual([lawbringer?.id]);
    expect(wardFull?.dependsOn).toStrictEqual([blightwarden?.id]);
  });

  it('VALID: {priorWorkItemIds: [prior]} => pesteater depends on the prior work item ids', () => {
    const proxy = questBuildBugHuntGraphBrokerProxy();
    proxy.setupUuidQueue({ uuids: UUIDS });
    const prior = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    const result = questBuildBugHuntGraphBroker({ priorWorkItemIds: [prior], now: NOW });

    const [pesteater] = result;

    expect(pesteater?.dependsOn).toStrictEqual([prior]);
  });

  it('VALID: ward items => first is changed mode, last is full mode, both spawnerType command', () => {
    const proxy = questBuildBugHuntGraphBrokerProxy();
    proxy.setupUuidQueue({ uuids: UUIDS });

    const result = questBuildBugHuntGraphBroker({ priorWorkItemIds: [], now: NOW });

    const [, wardChanged, , , wardFull] = result;

    expect(wardChanged?.spawnerType).toBe('command');
    expect(wardChanged?.wardMode).toBe('changed');
    expect(wardFull?.spawnerType).toBe('command');
    expect(wardFull?.wardMode).toBe('full');
  });

  it('VALID: lawbringer item => has no relatedDataItems (routes to whole-diff review)', () => {
    const proxy = questBuildBugHuntGraphBrokerProxy();
    proxy.setupUuidQueue({ uuids: UUIDS });

    const result = questBuildBugHuntGraphBroker({ priorWorkItemIds: [], now: NOW });

    const [, , lawbringer] = result;

    expect(lawbringer?.relatedDataItems).toStrictEqual([]);
  });
});
