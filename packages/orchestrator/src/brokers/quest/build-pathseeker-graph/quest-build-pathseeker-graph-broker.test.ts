import { PackageNameStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';
import { questBuildPathseekerGraphBroker } from './quest-build-pathseeker-graph-broker';
import { questBuildPathseekerGraphBrokerProxy } from './quest-build-pathseeker-graph-broker.proxy';

const NOW = IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' });

const SINGLE_UUIDS = [
  'aaaaaaaa-1111-4222-9333-444444444444',
  'bbbbbbbb-1111-4222-9333-444444444444',
  'cccccccc-1111-4222-9333-444444444444',
  'dddddddd-1111-4222-9333-444444444444',
] as const;

const MULTI_UUIDS = [
  'aaaaaaaa-1111-4222-9333-444444444444',
  'bbbbbbbb-1111-4222-9333-444444444444',
  'cccccccc-1111-4222-9333-444444444444',
  'dddddddd-1111-4222-9333-444444444444',
  'eeeeeeee-1111-4222-9333-444444444444',
  'ffffffff-1111-4222-9333-444444444444',
] as const;

const EMPTY_UUIDS = [
  '11111111-1111-4222-9333-444444444444',
  '22222222-1111-4222-9333-444444444444',
  '33333333-1111-4222-9333-444444444444',
  '44444444-1111-4222-9333-444444444444',
] as const;

const PRIOR_ID = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

describe('questBuildPathseekerGraphBroker', () => {
  describe('single package', () => {
    it('VALID: {packagesAffected: ["orchestrator"]} => 1 surface + 1 dedup + 1 assertion + 1 walk (4 items)', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: SINGLE_UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [PackageNameStub({ value: 'orchestrator' })],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      const roles = result.workItems.map((wi) => wi.role);

      expect(roles).toStrictEqual([
        'pathseeker-surface',
        'pathseeker-dedup',
        'pathseeker-assertion-correctness',
        'pathseeker-walk',
      ]);
    });

    it('VALID: {packagesAffected: ["orchestrator"]} => surface depends on prior, dedup+assertion depend on surface, walk depends on dedup+assertion', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: SINGLE_UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [PackageNameStub({ value: 'orchestrator' })],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      const [surface, dedup, assertion, walk] = result.workItems;

      expect(surface?.dependsOn).toStrictEqual([PRIOR_ID]);
      expect(dedup?.dependsOn).toStrictEqual([surface?.id]);
      expect(assertion?.dependsOn).toStrictEqual([surface?.id]);
      expect(walk?.dependsOn).toStrictEqual([dedup?.id, assertion?.id]);
    });

    it('VALID: {packagesAffected: ["orchestrator"]} => surface item carries sliceName="orchestrator"', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: SINGLE_UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [PackageNameStub({ value: 'orchestrator' })],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      const [surface] = result.workItems;

      expect(surface?.sliceName).toBe('orchestrator');
    });

    it('VALID: {packagesAffected: ["orchestrator"]} => one slice named "orchestrator" with that package', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: SINGLE_UUIDS });

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
    it('VALID: {packagesAffected: ["orchestrator","web"]} => 2 surface + 1 dedup + 1 assertion + 1 walk (5 items)', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: MULTI_UUIDS });

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

      expect(roles).toStrictEqual([
        'pathseeker-surface',
        'pathseeker-surface',
        'pathseeker-dedup',
        'pathseeker-assertion-correctness',
        'pathseeker-walk',
      ]);
    });

    it('VALID: {packagesAffected: ["orchestrator","web"]} => dedup + assertion both depend on every surface id', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: MULTI_UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [
          PackageNameStub({ value: 'orchestrator' }),
          PackageNameStub({ value: 'web' }),
        ],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      const [surfaceA, surfaceB, dedup, assertion, walk] = result.workItems;
      const surfaceIds = [surfaceA?.id, surfaceB?.id];

      expect(dedup?.dependsOn).toStrictEqual(surfaceIds);
      expect(assertion?.dependsOn).toStrictEqual(surfaceIds);
      expect(walk?.dependsOn).toStrictEqual([dedup?.id, assertion?.id]);
    });

    it('VALID: {packagesAffected: ["orchestrator","web"]} => each surface item carries the matching sliceName', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: MULTI_UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [
          PackageNameStub({ value: 'orchestrator' }),
          PackageNameStub({ value: 'web' }),
        ],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      const [surfaceA, surfaceB] = result.workItems;

      expect(surfaceA?.sliceName).toBe('orchestrator');
      expect(surfaceB?.sliceName).toBe('web');
    });

    it('VALID: {packagesAffected: ["orchestrator","web"]} => emits one slice per package', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: MULTI_UUIDS });

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
    it('VALID: {packagesAffected: []} => single "default" slice + the 4-item graph (policy: fall back to single-slice plan)', () => {
      const proxy = questBuildPathseekerGraphBrokerProxy();
      proxy.setupUuidQueue({ uuids: EMPTY_UUIDS });

      const result = questBuildPathseekerGraphBroker({
        packagesAffected: [],
        flowIds: [],
        priorWorkItemIds: [PRIOR_ID],
        now: NOW,
      });

      const roles = result.workItems.map((wi) => wi.role);

      expect(roles).toStrictEqual([
        'pathseeker-surface',
        'pathseeker-dedup',
        'pathseeker-assertion-correctness',
        'pathseeker-walk',
      ]);
      expect(result.slices).toStrictEqual([{ name: 'default', packages: [], flowIds: [] }]);
    });
  });
});
