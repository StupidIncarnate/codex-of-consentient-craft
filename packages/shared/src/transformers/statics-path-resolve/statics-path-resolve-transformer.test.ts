import { staticsPathResolveTransformer } from './statics-path-resolve-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

const API_ROUTES_SOURCE = ContentTextStub({
  value: `export const apiRoutesStatics = {
  health: {
    check: '/api/health',
  },
  quests: {
    list: '/api/quests',
    queue: '/api/quests/queue',
    byId: '/api/quests/:questId',
    start: '/api/quests/:questId/start',
    pause: '/api/quests/:questId/pause',
  },
  guilds: {
    list: '/api/guilds',
    byId: '/api/guilds/:guildId',
  },
} as const;`,
});

const WEB_CONFIG_SOURCE = ContentTextStub({
  value: `export const webConfigStatics = {
  api: {
    routes: {
      quests: '/api/quests',
      questStart: '/api/quests/:questId/start',
      questById: '/api/quests/:questId',
      guildById: '/api/guilds/:guildId',
    },
  },
} as const;`,
});

describe('staticsPathResolveTransformer', () => {
  describe('two-level paths', () => {
    it('VALID: {apiRoutesStatics.health.check} => resolves to /api/health', () => {
      const result = staticsPathResolveTransformer({
        source: API_ROUTES_SOURCE,
        dotPath: ContentTextStub({ value: 'apiRoutesStatics.health.check' }),
      });

      expect(result).toBe('/api/health');
    });

    it('VALID: {apiRoutesStatics.quests.list} => resolves to /api/quests', () => {
      const result = staticsPathResolveTransformer({
        source: API_ROUTES_SOURCE,
        dotPath: ContentTextStub({ value: 'apiRoutesStatics.quests.list' }),
      });

      expect(result).toBe('/api/quests');
    });

    it('VALID: {apiRoutesStatics.quests.start} => resolves to /api/quests/:questId/start', () => {
      const result = staticsPathResolveTransformer({
        source: API_ROUTES_SOURCE,
        dotPath: ContentTextStub({ value: 'apiRoutesStatics.quests.start' }),
      });

      expect(result).toBe('/api/quests/:questId/start');
    });

    it('VALID: {apiRoutesStatics.guilds.byId} => resolves to /api/guilds/:guildId', () => {
      const result = staticsPathResolveTransformer({
        source: API_ROUTES_SOURCE,
        dotPath: ContentTextStub({ value: 'apiRoutesStatics.guilds.byId' }),
      });

      expect(result).toBe('/api/guilds/:guildId');
    });
  });

  describe('three-level paths', () => {
    it('VALID: {webConfigStatics.api.routes.quests} => resolves to /api/quests', () => {
      const result = staticsPathResolveTransformer({
        source: WEB_CONFIG_SOURCE,
        dotPath: ContentTextStub({ value: 'webConfigStatics.api.routes.quests' }),
      });

      expect(result).toBe('/api/quests');
    });

    it('VALID: {webConfigStatics.api.routes.questStart} => resolves to /api/quests/:questId/start', () => {
      const result = staticsPathResolveTransformer({
        source: WEB_CONFIG_SOURCE,
        dotPath: ContentTextStub({ value: 'webConfigStatics.api.routes.questStart' }),
      });

      expect(result).toBe('/api/quests/:questId/start');
    });
  });

  describe('invalid paths', () => {
    it('INVALID: {path with missing key} => returns null', () => {
      const result = staticsPathResolveTransformer({
        source: API_ROUTES_SOURCE,
        dotPath: ContentTextStub({ value: 'apiRoutesStatics.quests.nonExistent' }),
      });

      expect(result).toBe(null);
    });

    it('INVALID: {path with no properties} => returns null', () => {
      const result = staticsPathResolveTransformer({
        source: API_ROUTES_SOURCE,
        dotPath: ContentTextStub({ value: 'apiRoutesStatics' }),
      });

      expect(result).toBe(null);
    });
  });

  describe('empty source', () => {
    it('EMPTY: {source with no object literal} => returns null', () => {
      const result = staticsPathResolveTransformer({
        source: ContentTextStub({ value: 'export const x = 42;' }),
        dotPath: ContentTextStub({ value: 'x.foo' }),
      });

      expect(result).toBe(null);
    });
  });
});
