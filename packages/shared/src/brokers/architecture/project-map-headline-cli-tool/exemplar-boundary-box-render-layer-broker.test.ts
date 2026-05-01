import { exemplarBoundaryBoxRenderLayerBroker } from './exemplar-boundary-box-render-layer-broker';
import { exemplarBoundaryBoxRenderLayerBrokerProxy } from './exemplar-boundary-box-render-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineCliToolStatics } from '../../../statics/project-map-headline-cli-tool/project-map-headline-cli-tool-statics';

describe('exemplarBoundaryBoxRenderLayerBroker', () => {
  describe('basic box structure', () => {
    it('VALID: {crossPackageName: @dungeonmaster/shared} => returns 5-element array', () => {
      exemplarBoundaryBoxRenderLayerBrokerProxy();

      const result = exemplarBoundaryBoxRenderLayerBroker({
        crossPackageName: ContentTextStub({ value: '@dungeonmaster/shared' }),
      });

      expect(result.map(String)).toStrictEqual([
        '      ╔══════════════════════════════════════════════════════════╗',
        '      ║ BOUNDARY → @dungeonmaster/shared                         ║',
        '      ║                                                          ║',
        '      ║ (cross-package adapter call)                             ║',
        '      ╚══════════════════════════════════════════════════════════╝',
      ]);
    });

    it('VALID: {crossPackageName: x} => first line uses top-left and top-right corners', () => {
      exemplarBoundaryBoxRenderLayerBrokerProxy();

      const result = exemplarBoundaryBoxRenderLayerBroker({
        crossPackageName: ContentTextStub({ value: 'x' }),
      });

      const firstLine = String(result[0]);

      expect(
        firstLine.startsWith(
          `${projectMapHeadlineCliToolStatics.genericBoundaryBoxIndent}${projectMapHeadlineCliToolStatics.genericBoundaryBoxCornerTL}`,
        ),
      ).toBe(true);
      expect(firstLine.endsWith(projectMapHeadlineCliToolStatics.genericBoundaryBoxCornerTR)).toBe(
        true,
      );
    });

    it('VALID: {crossPackageName: x} => last line uses bottom-left and bottom-right corners', () => {
      exemplarBoundaryBoxRenderLayerBrokerProxy();

      const result = exemplarBoundaryBoxRenderLayerBroker({
        crossPackageName: ContentTextStub({ value: 'x' }),
      });

      const lastLine = String(result[4]);

      expect(
        lastLine.startsWith(
          `${projectMapHeadlineCliToolStatics.genericBoundaryBoxIndent}${projectMapHeadlineCliToolStatics.genericBoundaryBoxCornerBL}`,
        ),
      ).toBe(true);
      expect(lastLine.endsWith(projectMapHeadlineCliToolStatics.genericBoundaryBoxCornerBR)).toBe(
        true,
      );
    });
  });

  describe('long package name widens the box', () => {
    it('VALID: {crossPackageName longer than note} => label line is wider than minimum', () => {
      exemplarBoundaryBoxRenderLayerBrokerProxy();

      const longName = '@dungeonmaster/very-long-package-name-that-exceeds-the-minimum-width';

      const result = exemplarBoundaryBoxRenderLayerBroker({
        crossPackageName: ContentTextStub({ value: longName }),
      });

      const topLine = String(result[0]);
      const minTopLine = '      ╔══════════════════════════════════════════════════════════╗';

      expect(topLine.length).toBeGreaterThan(minTopLine.length);
    });
  });
});
