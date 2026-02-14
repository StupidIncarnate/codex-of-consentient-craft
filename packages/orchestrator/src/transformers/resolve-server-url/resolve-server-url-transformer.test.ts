import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { resolveServerUrlTransformer } from './resolve-server-url-transformer';

describe('resolveServerUrlTransformer', () => {
  describe('default port', () => {
    it('VALID: {template with placeholder} => replaces with default server URL', () => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_PORT');

      const template = ContentTextStub({
        value: `curl ${environmentStatics.serverUrlPlaceholder}/api/health`,
      });

      const result = resolveServerUrlTransformer({ template });

      expect(result).toBe(
        `curl http://${environmentStatics.hostname}:${environmentStatics.defaultPort}/api/health`,
      );
    });

    it('VALID: {template with multiple placeholders} => replaces all occurrences', () => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_PORT');

      const template = ContentTextStub({
        value: `${environmentStatics.serverUrlPlaceholder}/api/a and ${environmentStatics.serverUrlPlaceholder}/api/b`,
      });

      const result = resolveServerUrlTransformer({ template });

      expect(result).toBe(
        `http://${environmentStatics.hostname}:${environmentStatics.defaultPort}/api/a and http://${environmentStatics.hostname}:${environmentStatics.defaultPort}/api/b`,
      );
    });
  });

  describe('custom port', () => {
    it('VALID: {DUNGEONMASTER_PORT=5737} => uses custom port in resolved URL', () => {
      process.env.DUNGEONMASTER_PORT = '5737';

      const template = ContentTextStub({
        value: `curl ${environmentStatics.serverUrlPlaceholder}/api/health`,
      });

      const result = resolveServerUrlTransformer({ template });

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_PORT');

      expect(result).toBe(`curl http://${environmentStatics.hostname}:5737/api/health`);
    });
  });

  describe('no placeholder', () => {
    it('VALID: {template without placeholder} => returns template unchanged', () => {
      const template = ContentTextStub({ value: 'no placeholder here' });

      const result = resolveServerUrlTransformer({ template });

      expect(result).toBe('no placeholder here');
    });
  });
});
