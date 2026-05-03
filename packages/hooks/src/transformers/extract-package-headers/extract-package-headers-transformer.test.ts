import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { extractPackageHeadersTransformer } from './extract-package-headers-transformer';

describe('extractPackageHeadersTransformer', () => {
  describe('extractHeaders()', () => {
    it('VALID: {projectMap: map with two packages} => returns compact list with names', () => {
      const projectMap = ContentTextStub({
        value: [
          '# cli [cli-tool]',
          '',
          'some content',
          '',
          '# config [library]',
          '',
          'more content',
        ].join('\n'),
      });

      const result = extractPackageHeadersTransformer({ projectMap });

      expect(result).toBe(
        ContentTextStub({
          value: ['## Packages', '', '- **cli**', '- **config**'].join('\n'),
        }),
      );
    });

    it('VALID: {projectMap: single package} => returns name only', () => {
      const projectMap = ContentTextStub({
        value: '# bare [library]\n\nsome content',
      });

      const result = extractPackageHeadersTransformer({ projectMap });

      expect(result).toBe(ContentTextStub({ value: '## Packages\n\n- **bare**' }));
    });

    it('EMPTY: {projectMap: no package headers} => returns header only', () => {
      const projectMap = ContentTextStub({
        value: '## some section\n\nNo packages found.',
      });

      const result = extractPackageHeadersTransformer({ projectMap });

      expect(result).toBe(ContentTextStub({ value: '## Packages\n\n' }));
    });
  });
});
