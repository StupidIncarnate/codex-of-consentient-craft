import { namespaceMethodsGroupByDomainTransformer } from './namespace-methods-group-by-domain-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

const GUILDS_DOMAIN = ContentTextStub({ value: 'Guilds' });
const ORCHESTRATION_DOMAIN = ContentTextStub({ value: 'Orchestration' });
const OTHER_DOMAIN = ContentTextStub({ value: 'Other' });

describe('namespaceMethodsGroupByDomainTransformer', () => {
  describe('empty input', () => {
    it('EMPTY: {no methods} => returns empty array', () => {
      const result = namespaceMethodsGroupByDomainTransformer({
        methodNames: [],
        prefixToDomain: {},
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('known methods', () => {
    it('VALID: {methods with known prefixes} => groups into correct domains', () => {
      const listGuilds = ContentTextStub({ value: 'listGuilds' });
      const getGuild = ContentTextStub({ value: 'getGuild' });
      const startQuest = ContentTextStub({ value: 'startQuest' });

      const result = namespaceMethodsGroupByDomainTransformer({
        methodNames: [listGuilds, getGuild, startQuest],
        prefixToDomain: {
          listGuilds: GUILDS_DOMAIN,
          getGuild: GUILDS_DOMAIN,
          startQuest: ORCHESTRATION_DOMAIN,
        },
      });

      expect(result).toStrictEqual([
        { domain: GUILDS_DOMAIN, methods: [listGuilds, getGuild] },
        { domain: ORCHESTRATION_DOMAIN, methods: [startQuest] },
      ]);
    });
  });

  describe('unknown methods', () => {
    it('VALID: {method not in prefix map} => grouped under Other', () => {
      const unknownMethod = ContentTextStub({ value: 'doMysteryThing' });

      const result = namespaceMethodsGroupByDomainTransformer({
        methodNames: [unknownMethod],
        prefixToDomain: {},
      });

      expect(result).toStrictEqual([{ domain: OTHER_DOMAIN, methods: [unknownMethod] }]);
    });

    it('VALID: {mixed known and unknown methods} => known grouped by domain, unknown under Other', () => {
      const listGuilds = ContentTextStub({ value: 'listGuilds' });
      const mystery = ContentTextStub({ value: 'doSomethingUnknown' });

      const result = namespaceMethodsGroupByDomainTransformer({
        methodNames: [listGuilds, mystery],
        prefixToDomain: { listGuilds: GUILDS_DOMAIN },
      });

      expect(result).toStrictEqual([
        { domain: GUILDS_DOMAIN, methods: [listGuilds] },
        { domain: OTHER_DOMAIN, methods: [mystery] },
      ]);
    });
  });

  describe('ordering', () => {
    it('VALID: {methods from two domains in interleaved order} => groups Guilds together, preserves insertion order of domains', () => {
      const listGuilds = ContentTextStub({ value: 'listGuilds' });
      const startQuest = ContentTextStub({ value: 'startQuest' });
      const addGuild = ContentTextStub({ value: 'addGuild' });

      const result = namespaceMethodsGroupByDomainTransformer({
        methodNames: [listGuilds, startQuest, addGuild],
        prefixToDomain: {
          listGuilds: GUILDS_DOMAIN,
          startQuest: ORCHESTRATION_DOMAIN,
          addGuild: GUILDS_DOMAIN,
        },
      });

      expect(result).toStrictEqual([
        { domain: GUILDS_DOMAIN, methods: [listGuilds, addGuild] },
        { domain: ORCHESTRATION_DOMAIN, methods: [startQuest] },
      ]);
    });
  });
});
