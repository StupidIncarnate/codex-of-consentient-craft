import { responderLinesRenderLayerBroker } from './responder-lines-render-layer-broker';
import { responderLinesRenderLayerBrokerProxy } from './responder-lines-render-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('responderLinesRenderLayerBroker', () => {
  describe('single responder no adapters', () => {
    it('VALID: {flow with one responder and no adapters} => returns ↳ responder line', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'quest-flow.ts': ContentTextStub({
            value: `import { questStartResponder } from '../../responders/quest/start/quest-start-responder';`,
          }),
          'quest-start-responder.ts': ContentTextStub({
            value: `export const questStartResponder = () => {};`,
          }),
        },
      });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([ContentTextStub({ value: '  ↳ questStartResponder' })]);
    });
  });

  describe('responder with adapter', () => {
    it('VALID: {flow with responder and adapter} => renders ↳ line and → adapter line', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/server/server-flow.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'server-flow.ts': ContentTextStub({
            value: `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
          }),
          'server-init-responder.ts': ContentTextStub({
            value: [
              `import { honoServeAdapter } from '../../../adapters/hono/serve/hono-serve-adapter';`,
              `export const serverInitResponder = () => {};`,
            ].join('\n'),
          }),
          'hono-serve-adapter.ts': ContentTextStub({
            value: `export const honoServeAdapter = () => {};`,
          }),
        },
      });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        ContentTextStub({ value: '  ↳ serverInitResponder' }),
        ContentTextStub({ value: '      → honoServeAdapter' }),
      ]);
    });
  });

  describe('empty flow', () => {
    it('EMPTY: {flow with no responder imports} => returns empty array', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/health/health-flow.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });

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
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/flows/home/home-flow.tsx',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/startup/start-app.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'home-flow.tsx': ContentTextStub({
            value: [
              `import { AppHomeResponder } from '../../responders/app/home/app-home-responder';`,
              `<Route path="/" element={<AppHomeResponder />} />`,
            ].join('\n'),
          }),
          'app-home-responder.ts': ContentTextStub({ value: '' }),
        },
      });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([ContentTextStub({ value: '  path="/" → AppHomeResponder' })]);
    });

    it('VALID: {flow with path-less layout Route} => renders (layout) ResponderSymbol line', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/flows/app/app-flow.tsx',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/startup/start-app.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'app-flow.tsx': ContentTextStub({
            value: [
              `import { AppLayoutResponder } from '../../responders/app/layout/app-layout-responder';`,
              `<Route element={<AppLayoutResponder />}>`,
            ].join('\n'),
          }),
          'app-layout-responder.ts': ContentTextStub({ value: '' }),
        },
      });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([ContentTextStub({ value: '  (layout) AppLayoutResponder' })]);
    });
  });

  describe('flow → flow recursion', () => {
    it('VALID: {flow imports child flow} => recurses with deeper indent', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/flows/app-mount/app-mount-flow.tsx',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/startup/start-app.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'app-mount-flow.tsx': ContentTextStub({
            value: `import { AppFlow } from '../app/app-flow';`,
          }),
          'app-flow.ts': ContentTextStub({
            value: [
              `import { HomeFlow } from '../home/home-flow';`,
              `export const appFlow = () => null;`,
            ].join('\n'),
          }),
          'home-flow.ts': ContentTextStub({
            value: [
              `import { AppHomeResponder } from '../../responders/app/home/app-home-responder';`,
              `<Route path="/" element={<AppHomeResponder />} />`,
              `export const homeFlow = () => null;`,
            ].join('\n'),
          }),
          'app-home-responder.ts': ContentTextStub({
            value: `export const AppHomeResponder = () => null;`,
          }),
        },
      });

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
      });

      expect(result).toStrictEqual([
        ContentTextStub({ value: '  ↳ appFlow' }),
        ContentTextStub({ value: '      ↳ homeFlow' }),
        ContentTextStub({ value: '          path="/" → AppHomeResponder' }),
      ]);
    });

    it('VALID: {circular flow imports} => visited set prevents infinite recursion', () => {
      const proxy = responderLinesRenderLayerBrokerProxy();
      const flowFile = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/flows/a/a-flow.tsx',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src' });
      const renderingFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/startup/start-app.ts',
      });

      proxy.setupFileContentsMap({
        map: {
          'a-flow.tsx': ContentTextStub({
            value: `import { BFlow } from '../b/b-flow';`,
          }),
          'b-flow.ts': ContentTextStub({
            value: [
              `import { AFlow } from '../a/a-flow';`,
              `export const bFlow = () => null;`,
            ].join('\n'),
          }),
        },
      });

      const visited = new Set<ReturnType<typeof AbsoluteFilePathStub>>();
      visited.add(flowFile);
      // The resolver appends `.ts` to relative imports regardless of the source file's
      // extension. Seed visited with the .ts variant too so b-flow's `import { AFlow }`
      // resolves to an already-visited node and recursion stops.
      visited.add(AbsoluteFilePathStub({ value: '/repo/packages/web/src/flows/a/a-flow.ts' }));

      const result = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath,
        visited,
      });

      expect(result).toStrictEqual([ContentTextStub({ value: '  ↳ bFlow' })]);
    });
  });
});
