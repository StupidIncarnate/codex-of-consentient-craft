import { packageSectionBuildLayerBroker } from './package-section-build-layer-broker';
import { packageSectionBuildLayerBrokerProxy } from './package-section-build-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = '/repo';
const PACKAGE_ROOT = '/repo/packages/orchestrator';
const PACKAGE_NAME = ContentTextStub({ value: 'orchestrator' });

describe('packageSectionBuildLayerBroker', () => {
  describe('section header', () => {
    it('VALID: {programmatic-service package} => section starts with # name [type] header', () => {
      packageSectionBuildLayerBrokerProxy();

      const result = packageSectionBuildLayerBroker({
        packageName: PACKAGE_NAME,
        packageRoot: PACKAGE_ROOT,
        packageType: 'programmatic-service',
        projectRoot: PROJECT_ROOT,
      });

      expect(String(result).split('\n')[0]).toStrictEqual('# orchestrator [programmatic-service]');
    });

    it('VALID: {any package type} => emits ## Boot header (no per-type headline section)', () => {
      packageSectionBuildLayerBrokerProxy();

      const result = packageSectionBuildLayerBroker({
        packageName: PACKAGE_NAME,
        packageRoot: PACKAGE_ROOT,
        packageType: 'http-backend',
        projectRoot: PROJECT_ROOT,
      });

      expect(
        String(result)
          .split('\n')
          .some((l) => l === '## Boot'),
      ).toBe(true);
    });

    it('VALID: {any package type} => does not emit any per-type ## headline section header', () => {
      packageSectionBuildLayerBrokerProxy();

      const result = packageSectionBuildLayerBroker({
        packageName: PACKAGE_NAME,
        packageRoot: PACKAGE_ROOT,
        packageType: 'http-backend',
        projectRoot: PROJECT_ROOT,
      });

      const lines = String(result).split('\n');
      const headlineHeaders = [
        '## Routes',
        '## Tools',
        '## Subcommands',
        '## Hooks',
        '## Config presets',
        '## Library exports',
        '## Consumers',
      ];
      const found = headlineHeaders.filter((header) => lines.some((l) => l.startsWith(header)));

      expect(found).toStrictEqual([]);
    });
  });
});
