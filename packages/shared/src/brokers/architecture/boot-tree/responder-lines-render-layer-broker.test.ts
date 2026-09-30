import { responderLinesRenderLayerBroker } from './responder-lines-render-layer-broker';
import { responderLinesRenderLayerBrokerProxy } from './responder-lines-render-layer-broker.proxy';

describe('responderLinesRenderLayerBroker', () => {
  describe('single responder no brokers', () => {
    it('VALID: {flow with one responder and no brokers} => returns ↳ responder line', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = '/repo/packages/server/src/flows/quest/quest-flow.ts';
      const packageSrcPath = '/repo/packages/server/src';
      const renderingFilePath = '/repo/packages/server/src/startup/start-server.ts';

      proxy.setupFileContentsMap({
        map: {
          'quest-flow.ts': `import { questStartResponder } from '../../responders/quest/start/quest-start-responder';`,
          'quest-start-responder.ts': `export const questStartResponder = () => {};`,
        },
      });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual(['  ↳ questStartResponder']);
    });
  });

  describe('responder with broker', () => {
    it('VALID: {flow with responder and broker} => renders ↳ line and → broker line', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = '/repo/packages/server/src/flows/server/server-flow.ts';
      const packageSrcPath = '/repo/packages/server/src';
      const renderingFilePath = '/repo/packages/server/src/startup/start-server.ts';

      proxy.setupFileContentsMap({
        map: {
          'server-flow.ts': `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
          'server-init-responder.ts': [
              `import { serverInitBroker } from '../../../brokers/server/init/server-init-broker';`,
              `export const serverInitResponder = () => {};`,
            ].join('\n'),
          'server-init-broker.ts': `export const serverInitBroker = () => {};`,
        },
      });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        '  ↳ serverInitResponder',
        '      → serverInitBroker',
      ]);
    });
  });

  describe('empty flow', () => {
    it('EMPTY: {flow with no responder imports} => returns empty array', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = '/repo/packages/server/src/flows/health/health-flow.ts';
      const packageSrcPath = '/repo/packages/server/src';
      const renderingFilePath = '/repo/packages/server/src/startup/start-server.ts';

      proxy.setupFileContentsMap({ map: {} });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('react-router metadata', () => {
    it('VALID: {flow with path Route} => renders path="..." → ResponderSymbol line', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = '/repo/packages/web/src/flows/home/home-flow.tsx';
      const packageSrcPath = '/repo/packages/web/src';
      const renderingFilePath = '/repo/packages/web/src/startup/start-app.ts';

      proxy.setupFileContentsMap({
        map: {
          'home-flow.tsx': [
              `import { AppHomeResponder } from '../../responders/app/home/app-home-responder';`,
              `<Route path="/" element={<AppHomeResponder />} />`,
            ].join('\n'),
          'app-home-responder.ts': '',
        },
      });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual(['  path="/" → AppHomeResponder']);
    });

    it('VALID: {flow with path-less layout Route} => renders (layout) ResponderSymbol line', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = '/repo/packages/web/src/flows/app/app-flow.tsx';
      const packageSrcPath = '/repo/packages/web/src';
      const renderingFilePath = '/repo/packages/web/src/startup/start-app.ts';

      proxy.setupFileContentsMap({
        map: {
          'app-flow.tsx': [
              `import { AppLayoutResponder } from '../../responders/app/layout/app-layout-responder';`,
              `<Route element={<AppLayoutResponder />}>`,
            ].join('\n'),
          'app-layout-responder.ts': '',
        },
      });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual(['  (layout) AppLayoutResponder']);
    });
  });

  describe('flow → flow recursion', () => {
    it('VALID: {flow imports child flow} => recurses with deeper indent', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = '/repo/packages/web/src/flows/app-mount/app-mount-flow.tsx';
      const packageSrcPath = '/repo/packages/web/src';
      const renderingFilePath = '/repo/packages/web/src/startup/start-app.ts';

      proxy.setupFileContentsMap({
        map: {
          'app-mount-flow.tsx': `import { AppFlow } from '../app/app-flow';`,
          'app-flow.ts': [
              `import { HomeFlow } from '../home/home-flow';`,
              `export const appFlow = () => null;`,
            ].join('\n'),
          'home-flow.ts': [
              `import { AppHomeResponder } from '../../responders/app/home/app-home-responder';`,
              `<Route path="/" element={<AppHomeResponder />} />`,
              `export const homeFlow = () => null;`,
            ].join('\n'),
          'app-home-responder.ts': `export const AppHomeResponder = () => null;`,
        },
      });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        '  ↳ appFlow',
        '      ↳ homeFlow',
        '          path="/" → AppHomeResponder',
      ]);
    });

    it('VALID: {circular flow imports} => visited set prevents infinite recursion', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = '/repo/packages/web/src/flows/a/a-flow.tsx';
      const packageSrcPath = '/repo/packages/web/src';
      const renderingFilePath = '/repo/packages/web/src/startup/start-app.ts';

      proxy.setupFileContentsMap({
        map: {
          'a-flow.tsx': `import { BFlow } from '../b/b-flow';`,
          'b-flow.ts': [
              `import { AFlow } from '../a/a-flow';`,
              `export const bFlow = () => null;`,
            ].join('\n'),
        },
      });

      const visited = new Set<string>();
      visited.add(flowFile);
      // The resolver appends `.ts` to relative imports regardless of the source file's
      // extension. Seed visited with the .ts variant too so b-flow's `import { AFlow }`
      // resolves to an already-visited node and recursion stops.
      visited.add('/repo/packages/web/src/flows/a/a-flow.ts');

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
        visited,
      });

      expect(result).toStrictEqual(['  ↳ bFlow']);
    });
  });
});
