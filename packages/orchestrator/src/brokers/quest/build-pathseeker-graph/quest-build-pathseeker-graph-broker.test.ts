import { PackageNameStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';
import { questBuildPathseekerGraphBroker } from './quest-build-pathseeker-graph-broker';
import { questBuildPathseekerGraphBrokerProxy } from './quest-build-pathseeker-graph-broker.proxy';

const NOW = IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' });

const UUIDS = [
  'aaaaaaaa-1111-4222-9333-444444444444',
  'bbbbbbbb-1111-4222-9333-444444444444',
] as const;

const PRIOR_ID = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

describe('questBuildPathseekerGraphBroker', () => {
  describe('single package', () => {
    it('VALID: {packagesAffected: ["orchestrator"]} => single pathseeker work item', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [PackageNameStub({ value: 'orchestrator' })],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      const roles = result.workItems.map((wi) => wi.role);

      expect(roles).toStrictEqual(['pathseeker']);
    });

    it('VALID: {packagesAffected: ["orchestrator"]} => pathseeker item depends on prior work items', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [PackageNameStub({ value: 'orchestrator' })],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      const [pathseeker] = result.workItems;

      expect(pathseeker?.dependsOn).toStrictEqual([PRIOR_ID]);
    });

    it('VALID: {packagesAffected: ["orchestrator"]} => one slice named "orchestrator" with that package', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [PackageNameStub({ value: 'orchestrator' })],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      expect(result.slices).toStrictEqual([
        {
          name: 'orchestrator',
          packages: ['orchestrator'],
          flowIds: [],
        },
      ]);
    });
  });

  describe('multi package', () => {
    it('VALID: {packagesAffected: ["orchestrator","web"]} => still one pathseeker work item', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [
          PackageNameStub({ value: 'orchestrator' }),
          PackageNameStub({ value: 'web' }),
        ],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      const roles = result.workItems.map((wi) => wi.role);

      expect(roles).toStrictEqual(['pathseeker']);
    });

    it('VALID: {packagesAffected: ["orchestrator","web"]} => emits one slice per package for scopeClassification', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [
          PackageNameStub({ value: 'orchestrator' }),
          PackageNameStub({ value: 'web' }),
        ],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      expect(result.slices).toStrictEqual([
        { name: 'orchestrator', packages: ['orchestrator'], flowIds: [] },
        { name: 'web', packages: ['web'], flowIds: [] },
      ]);
    });
  });

  describe('empty packagesAffected', () => {
    it('VALID: {packagesAffected: []} => single "default" slice + the single pathseeker item', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      const roles = result.workItems.map((wi) => wi.role);

      expect(roles).toStrictEqual(['pathseeker']);
      expect(result.slices).toStrictEqual([{ name: 'default', packages: [], flowIds: [] }]);
    });
  });
});
