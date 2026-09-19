import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { RecipeResultStub } from '@dungeonmaster/siegelense-recipes/contracts';

import { InstanceManifestStub } from '../../contracts/instance-manifest/instance-manifest.stub';
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
          path: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21',
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
          'EVIDENCE: /repo/.siegelense/guilds/g1/instances/inst_7f3a9c21\n' +
          'BOOT: 21000ms\n' +
          'SEEDED: none\n',
      );
    });
  });

  describe('manifest with seeded recipe', () => {
    it('VALID: {seeded manifest} => renders serialized seed JSON', () => {
      const seed = RecipeResultStub({
        guildSlug: 'siege-guild',
      });
      const manifest = InstanceManifestStub({
        instanceId: 'inst_7f3a9c21',
        specName: 'dungeonmaster-stack',
        baseUrl: 'http://localhost:34173',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        evidence: {
          path: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21',
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
          'EVIDENCE: /repo/.siegelense/guilds/g1/instances/inst_7f3a9c21\n' +
          'BOOT: 15000ms\n' +
          `SEEDED: ${JSON.stringify(seed)}\n`,
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
          path: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21',
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
          'EVIDENCE: /repo/.siegelense/guilds/g1/instances/inst_7f3a9c21\n' +
          'BOOT: 5000ms\n' +
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
