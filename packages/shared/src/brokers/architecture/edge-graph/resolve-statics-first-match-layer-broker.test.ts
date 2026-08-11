import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { resolveStaticsFirstMatchLayerBrokerProxy } from './resolve-statics-first-match-layer-broker.proxy';
import { resolveStaticsFirstMatchLayerBroker } from './resolve-statics-first-match-layer-broker';

describe('resolveStaticsFirstMatchLayerBroker', () => {
  describe('single source', () => {
    it('VALID: {one source defining the path} => returns the resolved value', () => {
      resolveStaticsFirstMatchLayerBrokerProxy();
      const source = ContentTextStub({
        value: "export const apiRoutesStatics = { quests: { list: '/api/quests' } } as const;",
      });

      const result = resolveStaticsFirstMatchLayerBroker({
        sources: [source],
        dotPath: ContentTextStub({ value: 'apiRoutesStatics.quests.list' }),
      });

      expect(result).toBe('/api/quests');
    });
  });

  describe('multiple sources', () => {
    it('VALID: {second source defines the path, first does not} => returns the second source value', () => {
      resolveStaticsFirstMatchLayerBrokerProxy();
      const sourceA = ContentTextStub({
        value: "export const apiRoutesStatics = { health: { check: '/api/health' } } as const;",
      });
      const sourceB = ContentTextStub({
        value: "export const apiRoutesStatics = { quests: { list: '/api/quests' } } as const;",
      });

      const result = resolveStaticsFirstMatchLayerBroker({
        sources: [sourceA, sourceB],
        dotPath: ContentTextStub({ value: 'apiRoutesStatics.quests.list' }),
      });

      expect(result).toBe('/api/quests');
    });

    it('VALID: {first source defines the path} => returns the first source value without needing the second', () => {
      resolveStaticsFirstMatchLayerBrokerProxy();
      const sourceA = ContentTextStub({
        value: "export const apiRoutesStatics = { quests: { list: '/api/quests-a' } } as const;",
      });
      const sourceB = ContentTextStub({
        value: "export const apiRoutesStatics = { quests: { list: '/api/quests-b' } } as const;",
      });

      const result = resolveStaticsFirstMatchLayerBroker({
        sources: [sourceA, sourceB],
        dotPath: ContentTextStub({ value: 'apiRoutesStatics.quests.list' }),
      });

      expect(result).toBe('/api/quests-a');
    });
  });

  describe('no source defines the path', () => {
    it('INVALID: {no source defines quests.list} => returns null', () => {
      resolveStaticsFirstMatchLayerBrokerProxy();
      const source = ContentTextStub({
        value: "export const apiRoutesStatics = { health: { check: '/api/health' } } as const;",
      });

      const result = resolveStaticsFirstMatchLayerBroker({
        sources: [source],
        dotPath: ContentTextStub({ value: 'apiRoutesStatics.quests.list' }),
      });

      expect(result).toBe(null);
    });
  });

  describe('empty sources', () => {
    it('EMPTY: {sources: []} => returns null', () => {
      resolveStaticsFirstMatchLayerBrokerProxy();

      const result = resolveStaticsFirstMatchLayerBroker({
        sources: [],
        dotPath: ContentTextStub({ value: 'apiRoutesStatics.quests.list' }),
      });

      expect(result).toBe(null);
    });
  });
});
