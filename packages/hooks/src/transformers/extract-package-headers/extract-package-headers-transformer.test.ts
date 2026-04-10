import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { extractPackageHeadersTransformer } from './extract-package-headers-transformer';

describe('extractPackageHeadersTransformer', () => {
  describe('extractHeaders()', () => {
    it('VALID: {projectMap: map with two packages} => returns compact list with names and descriptions', () => {
      const projectMap = ContentTextStub({
        value: [
          '# Codebase Map',
          '',
          '## cli (69 files) — CLI for quest management',
          '  brokers/ (12) — install (execute, orchestrate)',
          '',
          '## config (96 files) — Configuration parser and resolver',
          '  statics/ (14) — framework, routing-library',
        ].join('\n'),
      });

      const result = extractPackageHeadersTransformer({ projectMap });

      expect(result).toBe(
        ContentTextStub({
          value: [
            '## Packages',
            '',
            '- **cli** — CLI for quest management',
            '- **config** — Configuration parser and resolver',
          ].join('\n'),
        }),
      );
    });

    it('VALID: {projectMap: package without description} => returns name only', () => {
      const projectMap = ContentTextStub({
        value: '## bare (5 files)\n  brokers/ (2)',
      });

      const result = extractPackageHeadersTransformer({ projectMap });

      expect(result).toBe(ContentTextStub({ value: '## Packages\n\n- **bare**' }));
    });

    it('EMPTY: {projectMap: no package headers} => returns header only', () => {
      const projectMap = ContentTextStub({
        value: '# Codebase Map\n\nNo packages found.',
      });

      const result = extractPackageHeadersTransformer({ projectMap });

      expect(result).toBe(ContentTextStub({ value: '## Packages\n\n' }));
    });
  });
});
