import { architectureBootTreeBroker } from './architecture-boot-tree-broker';
import { architectureBootTreeBrokerProxy } from './architecture-boot-tree-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('architectureBootTreeBroker', () => {
  describe('single startup → single flow → single responder → single adapter', () => {
    it('VALID: {simple startup→flow→responder→adapter chain} => renders clean boot tree', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/server' });

      proxy.setupStartupFiles({ names: ['start-server.ts'] });
      proxy.setupFileContentsMap({
        map: {
          'start-server.ts': ContentTextStub({
            value: [
              `import { serverFlow } from '../flows/server/server-flow';`,
              `export const startServer = () => {};`,
            ].join('\n'),
          }),
          'server-flow.ts': ContentTextStub({
            value: [
              `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
              `export const serverFlow = () => {};`,
            ].join('\n'),
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

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        ContentTextStub({
          value: [
            '## Boot',
            '',
            '```',
            'startServer',
            '  ↳ flows/{serverFlow}',
            '',
            'serverFlow',
            '  ↳ serverInitResponder',
            '      → honoServeAdapter',
            '```',
          ].join('\n'),
        }),
      );
    });
  });

  describe('multi-flow startup', () => {
    it('VALID: {startup with three flows} => expands flows/{questFlow, guildFlow, healthFlow}', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/server' });

      proxy.setupStartupFiles({ names: ['start-server.ts'] });
      proxy.setupFileContentsMap({
        map: {
          'start-server.ts': ContentTextStub({
            value: [
              `import { questFlow } from '../flows/quest/quest-flow';`,
              `import { guildFlow } from '../flows/guild/guild-flow';`,
              `import { healthFlow } from '../flows/health/health-flow';`,
              `export const startServer = () => {};`,
            ].join('\n'),
          }),
          'quest-flow.ts': ContentTextStub({ value: `export const questFlow = () => {};` }),
          'guild-flow.ts': ContentTextStub({ value: `export const guildFlow = () => {};` }),
          'health-flow.ts': ContentTextStub({ value: `export const healthFlow = () => {};` }),
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        ContentTextStub({
          value: [
            '## Boot',
            '',
            '```',
            'startServer',
            '  ↳ flows/{questFlow, guildFlow, healthFlow}',
            '',
            'questFlow',
            '',
            'guildFlow',
            '',
            'healthFlow',
            '```',
          ].join('\n'),
        }),
      );
    });
  });

  describe('layer file inlining', () => {
    it('VALID: {flow imports entry + layer responder} => layer file absent from ↳ lines', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/server' });

      proxy.setupStartupFiles({ names: ['start-server.ts'] });
      proxy.setupFileContentsMap({
        map: {
          'start-server.ts': ContentTextStub({
            value: [
              `import { serverFlow } from '../flows/server/server-flow';`,
              `export const startServer = () => {};`,
            ].join('\n'),
          }),
          'server-flow.ts': ContentTextStub({
            value: [
              `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
              `import { serverValidateLayerResponder } from '../../responders/server/init/server-validate-layer-responder';`,
              `export const serverFlow = () => {};`,
            ].join('\n'),
          }),
          'server-init-responder.ts': ContentTextStub({
            value: `export const serverInitResponder = () => {};`,
          }),
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        ContentTextStub({
          value: [
            '## Boot',
            '',
            '```',
            'startServer',
            '  ↳ flows/{serverFlow}',
            '',
            'serverFlow',
            '  ↳ serverInitResponder',
            '```',
          ].join('\n'),
        }),
      );
    });
  });

  describe('WS subscriber adapter', () => {
    it('VALID: {EventsOn adapter in responder} => renders as a regular → adapter leaf', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/server' });

      proxy.setupStartupFiles({ names: ['start-server.ts'] });
      proxy.setupFileContentsMap({
        map: {
          'start-server.ts': ContentTextStub({
            value: [
              `import { serverFlow } from '../flows/server/server-flow';`,
              `export const startServer = () => {};`,
            ].join('\n'),
          }),
          'server-flow.ts': ContentTextStub({
            value: [
              `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
              `export const serverFlow = () => {};`,
            ].join('\n'),
          }),
          'server-init-responder.ts': ContentTextStub({
            value: [
              `import { orchestratorEventsOnAdapter } from '../../../adapters/orchestrator/events-on/orchestrator-events-on-adapter';`,
              `export const serverInitResponder = () => {};`,
            ].join('\n'),
          }),
          'orchestrator-events-on-adapter.ts': ContentTextStub({
            value: `export const orchestratorEventsOnAdapter = () => {};`,
          }),
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        ContentTextStub({
          value: [
            '## Boot',
            '',
            '```',
            'startServer',
            '  ↳ flows/{serverFlow}',
            '',
            'serverFlow',
            '  ↳ serverInitResponder',
            '      → orchestratorEventsOnAdapter',
            '```',
          ].join('\n'),
        }),
      );
    });
  });

  describe('no startup files', () => {
    it('EMPTY: {package with no startup files} => returns placeholder', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/library' });

      proxy.setupNoStartupFiles();

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        ContentTextStub({
          value: '## Boot\n\n```\n(no startup files found)\n```',
        }),
      );
    });
  });

  describe('test and proxy file filtering', () => {
    it('VALID: {startup dir with proxy file} => proxy file absent from output', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/server' });

      proxy.setupStartupFiles({ names: ['start-server.ts', 'start-server.proxy.ts'] });
      proxy.setupFileContentsMap({
        map: {
          'start-server.ts': ContentTextStub({
            value: `export const startServer = () => {};`,
          }),
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        ContentTextStub({
          value: ['## Boot', '', '```', 'startServer', '```'].join('\n'),
        }),
      );
    });
  });
});
