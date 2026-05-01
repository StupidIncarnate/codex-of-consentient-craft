import { methodDomainGroupContract } from './method-domain-group-contract';
import { MethodDomainGroupStub } from './method-domain-group.stub';

describe('methodDomainGroupContract', () => {
  describe('valid input', () => {
    it('VALID: {stub defaults} => parses successfully with Guilds domain', () => {
      const result = MethodDomainGroupStub();

      expect(result).toStrictEqual({
        domain: 'Guilds',
        methods: ['listGuilds'],
      });
    });

    it('VALID: {domain and methods} => parses successfully', () => {
      const result = methodDomainGroupContract.parse({
        domain: 'Guilds',
        methods: ['listGuilds', 'addGuild'],
      });

      expect(result).toStrictEqual({
        domain: 'Guilds',
        methods: ['listGuilds', 'addGuild'],
      });
    });

    it('VALID: {empty methods array} => parses successfully', () => {
      const result = methodDomainGroupContract.parse({
        domain: 'Other',
        methods: [],
      });

      expect(result).toStrictEqual({
        domain: 'Other',
        methods: [],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {missing domain} => throws validation error', () => {
      expect(() => {
        return methodDomainGroupContract.parse({
          methods: ['listGuilds'],
        });
      }).toThrow(/Required/u);
    });
  });
});
