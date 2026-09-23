import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { InstanceManifestStub } from '../../contracts/instance-manifest/instance-manifest.stub';
import { SeedResultStub } from '../../contracts/seed-result/seed-result.stub';
import { startAnswerRenderTransformer } from './start-answer-render-transformer';

describe('startAnswerRenderTransformer', () => {
  describe('default manifest without seed', () => {
    it('VALID: {unseeded manifest} => renders human summary with URL, HOME, EVIDENCE, and SEEDED none', () => {
      const manifest = InstanceManifestStub({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://localhost:34173',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        bootMs: 21_000,
        seeded: null,
      });

      const result = startAnswerRenderTransformer({ manifest });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (dungeonmaster-stack)\n' +
          'URL: http://localhost:34173\n' +
          'API: -\n' +
          'HOME: /tmp/dm-siege-inst_7f3a9c21\n' +
          'EVIDENCE: /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21\n' +
          'BOOT: 21000ms\n' +
          'SEEDED: none\n',
      );
    });
  });

  describe('manifest with a seed that produced no rows', () => {
    it('VALID: {seeded: {}} => renders SEEDED as empty, distinct from none', () => {
      const manifest = InstanceManifestStub({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://localhost:34173',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        bootMs: 15_000,
        seeded: {},
      });

      const result = startAnswerRenderTransformer({ manifest });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (dungeonmaster-stack)\n' +
          'URL: http://localhost:34173\n' +
          'API: -\n' +
          'HOME: /tmp/dm-siege-inst_7f3a9c21\n' +
          'EVIDENCE: /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21\n' +
          'BOOT: 15000ms\n' +
          'SEEDED: (empty)\n',
      );
    });
  });

  describe('manifest with a bare-id seed binding (flat arm of SeedResult)', () => {
    it('VALID: {seeded: {guildSlug: "siege-guild"}} => renders the id with no row to summarise', () => {
      const manifest = InstanceManifestStub({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://localhost:34173',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        bootMs: 15_000,
        seeded: { guildSlug: ContentTextStub({ value: 'siege-guild' }) },
      });

      const result = startAnswerRenderTransformer({ manifest });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (dungeonmaster-stack)\n' +
          'URL: http://localhost:34173\n' +
          'API: -\n' +
          'HOME: /tmp/dm-siege-inst_7f3a9c21\n' +
          'EVIDENCE: /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21\n' +
          'BOOT: 15000ms\n' +
          'SEEDED:\n' +
          '  guildSlug: siege-guild\n',
      );
    });
  });

  describe('manifest with a seeded guild row (record arm of SeedResult)', () => {
    it('VALID: {seeded: guild-empty shape} => renders id plus name and urlSlug, never the whole row', () => {
      const seed = SeedResultStub();
      const manifest = InstanceManifestStub({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://localhost:34173',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        bootMs: 15_000,
        seeded: seed,
      });

      const result = startAnswerRenderTransformer({ manifest });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (dungeonmaster-stack)\n' +
          'URL: http://localhost:34173\n' +
          'API: -\n' +
          'HOME: /tmp/dm-siege-inst_7f3a9c21\n' +
          'EVIDENCE: /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21\n' +
          'BOOT: 15000ms\n' +
          'SEEDED:\n' +
          '  guild: 7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41 (name: Siege Guild, urlSlug: siege-guild)\n',
      );
    });
  });

  describe('manifest with a seeded guild and three seeded quest rows', () => {
    it('VALID: {seeded: guild-with-three-quests shape} => renders one summary line per binding, each row title and status only', () => {
      const seed = SeedResultStub({
        questCreated: { id: 'q1', title: 'Add Auth', status: 'created' },
        questInProgress: { id: 'q2', title: 'Add Billing', status: 'in_progress' },
        questComplete: { id: 'q3', title: 'Add Search', status: 'complete' },
      });
      const manifest = InstanceManifestStub({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://localhost:34173',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        bootMs: 15_000,
        seeded: seed,
      });

      const result = startAnswerRenderTransformer({ manifest });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (dungeonmaster-stack)\n' +
          'URL: http://localhost:34173\n' +
          'API: -\n' +
          'HOME: /tmp/dm-siege-inst_7f3a9c21\n' +
          'EVIDENCE: /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21\n' +
          'BOOT: 15000ms\n' +
          'SEEDED:\n' +
          '  guild: 7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41 (name: Siege Guild, urlSlug: siege-guild)\n' +
          '  questCreated: q1 (title: Add Auth, status: created)\n' +
          '  questInProgress: q2 (title: Add Billing, status: in_progress)\n' +
          '  questComplete: q3 (title: Add Search, status: complete)\n',
      );
    });
  });

  describe('manifest with a seeded row carrying no recognised identity field and no string id', () => {
    it('VALID: {seeded row: {id: 42, count: 5}} => falls back to a dash id with no parenthetical', () => {
      const seed = SeedResultStub({
        guild: { id: 42, count: 5 },
      });
      const manifest = InstanceManifestStub({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://localhost:34173',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        bootMs: 15_000,
        seeded: seed,
      });

      const result = startAnswerRenderTransformer({ manifest });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (dungeonmaster-stack)\n' +
          'URL: http://localhost:34173\n' +
          'API: -\n' +
          'HOME: /tmp/dm-siege-inst_7f3a9c21\n' +
          'EVIDENCE: /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21\n' +
          'BOOT: 15000ms\n' +
          'SEEDED:\n' +
          '  guild: -\n',
      );
    });
  });

  describe('browserless manifest', () => {
    it('VALID: {baseUrl: null} => renders URL as -', () => {
      const manifest = InstanceManifestStub({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-api',
        baseUrl: null,
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21',
          linkPresent: true,
        },
        bootMs: 5000,
        seeded: null,
      });

      const result = startAnswerRenderTransformer({ manifest });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (dungeonmaster-api)\n' +
          'URL: -\n' +
          'API: -\n' +
          'HOME: /tmp/dm-siege-inst_7f3a9c21\n' +
          'EVIDENCE: /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_7f3a9c21\n' +
          'BOOT: 5000ms\n' +
          'SEEDED: none\n',
      );
    });
  });

  describe('manifest shaped like a real dungeonmaster-stack boot', () => {
    it('VALID: {baseUrl and apiUrl from allocated ports, no url/paths override} => renders both URL and API lines', () => {
      const manifest = InstanceManifestStub({
        instanceId: 'inst_1c60cf225b13465d8b32449607d69529',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://dungeonmaster.localhost:41385',
        apiUrl: ContentTextStub({ value: 'http://dungeonmaster.localhost:37895' }),
        home: '/tmp/dm-siege-inst_1c60cf225b13465d8b32449607d69529',
        evidence: {
          path: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1c60cf225b13465d8b32449607d69529',
          linkPresent: true,
        },
        bootMs: 18_000,
        seeded: null,
      });

      const result = startAnswerRenderTransformer({ manifest });

      expect(result).toBe(
        'INSTANCE: inst_1c60cf225b13465d8b32449607d69529 (dungeonmaster-stack)\n' +
          'URL: http://dungeonmaster.localhost:41385\n' +
          'API: http://dungeonmaster.localhost:37895\n' +
          'HOME: /tmp/dm-siege-inst_1c60cf225b13465d8b32449607d69529\n' +
          'EVIDENCE: /repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1c60cf225b13465d8b32449607d69529\n' +
          'BOOT: 18000ms\n' +
          'SEEDED: none\n',
      );
    });
  });

  describe('manifest with explicit url, apiUrl, and paths', () => {
    it('VALID: {url, apiUrl, paths} => renders explicit url, apiUrl, and paths values', () => {
      const manifest = InstanceManifestStub({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://localhost:34173',
        url: ContentTextStub({ value: 'http://localhost:34173' }),
        apiUrl: ContentTextStub({ value: 'http://localhost:34172' }),
        paths: {
          home: '/custom/home/path',
          evidenceDir: ContentTextStub({ value: '/custom/evidence/path' }),
        },
        bootMs: 12_000,
        seeded: null,
      });

      const result = startAnswerRenderTransformer({ manifest });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (dungeonmaster-stack)\n' +
          'URL: http://localhost:34173\n' +
          'API: http://localhost:34172\n' +
          'HOME: /custom/home/path\n' +
          'EVIDENCE: /custom/evidence/path\n' +
          'BOOT: 12000ms\n' +
          'SEEDED: none\n',
      );
    });
  });
});
