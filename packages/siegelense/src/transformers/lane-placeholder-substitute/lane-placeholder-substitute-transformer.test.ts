import { lanePlaceholderSubstituteTransformer } from './lane-placeholder-substitute-transformer';
import { PortPairStub } from '../../contracts/port-pair/port-pair.stub';

describe('lanePlaceholderSubstituteTransformer', () => {
  describe('single placeholder', () => {
    it('VALID: {template: "{apiPort}"} => returns the api port as a string', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{apiPort}',
        ports: PortPairStub({ api: 34_172, web: 34_173 }),
      });

      expect(result).toBe('34172');
    });

    it('VALID: {template: "{webPort}"} => returns the web port as a string', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{webPort}',
        ports: PortPairStub({ api: 34_172, web: 34_173 }),
      });

      expect(result).toBe('34173');
    });
  });

  describe('placeholders inside a larger string', () => {
    it('VALID: {template: "http://host:{apiPort}/api/guilds"} => substitutes in place', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: 'http://host:{apiPort}/api/guilds',
        ports: PortPairStub({ api: 34_172, web: 34_173 }),
      });

      expect(result).toBe('http://host:34172/api/guilds');
    });

    it('VALID: {template: both placeholders} => substitutes each independently', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: 'api={apiPort} web={webPort}',
        ports: PortPairStub({ api: 34_172, web: 34_173 }),
      });

      expect(result).toBe('api=34172 web=34173');
    });

    it('VALID: {template: repeated placeholder} => substitutes every occurrence', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{apiPort}-{apiPort}',
        ports: PortPairStub({ api: 34_172, web: 34_173 }),
      });

      expect(result).toBe('34172-34172');
    });
  });

  describe('templates carrying an unrelated placeholder', () => {
    it('EDGE: {template: "{home}"} => passes the unknown placeholder through untouched', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: '{home}',
        ports: PortPairStub({ api: 34_172, web: 34_173 }),
      });

      expect(result).toBe('{home}');
    });
  });

  describe('templates with no placeholder', () => {
    it('EMPTY: {template: "api-server.log"} => returns it unchanged', () => {
      const result = lanePlaceholderSubstituteTransformer({
        template: 'api-server.log',
        ports: PortPairStub({ api: 34_172, web: 34_173 }),
      });

      expect(result).toBe('api-server.log');
    });
  });
});
