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
            value: `import { serverFlow } from '../flows/server/server-flow';`,
          }),
          'server-flow.ts': ContentTextStub({
            value: `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
          }),
          'server-init-responder.ts': ContentTextStub({
            value: `import { honoServeAdapter } from '../../../adapters/hono/serve/hono-serve-adapter';`,
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
            'startup/start-server',
            '  ↳ flows/{server}',
            '',
            'flows/server/server-flow',
            '  ↳ server-init-responder',
            '      → adapters/hono/serve',
            '```',
          ].join('\n'),
        }),
      );
    });
  });

  describe('multi-flow startup', () => {
    it('VALID: {startup with three flows} => expands flows/{quest, guild, health}', () => {
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
            ].join('\n'),
          }),
          'quest-flow.ts': ContentTextStub({ value: '' }),
          'guild-flow.ts': ContentTextStub({ value: '' }),
          'health-flow.ts': ContentTextStub({ value: '' }),
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        ContentTextStub({
          value: [
            '## Boot',
            '',
            '```',
            'startup/start-server',
            '  ↳ flows/{quest, guild, health}',
            '',
            'flows/quest/quest-flow',
            '',
            'flows/guild/guild-flow',
            '',
            'flows/health/health-flow',
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
            value: `import { serverFlow } from '../flows/server/server-flow';`,
          }),
          'server-flow.ts': ContentTextStub({
            value: [
              `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
              `import { serverValidateLayerResponder } from '../../responders/server/init/server-validate-layer-responder';`,
            ].join('\n'),
          }),
          'server-init-responder.ts': ContentTextStub({ value: '' }),
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        ContentTextStub({
          value: [
            '## Boot',
            '',
            '```',
            'startup/start-server',
            '  ↳ flows/{server}',
            '',
            'flows/server/server-flow',
            '  ↳ server-init-responder',
            '```',
          ].join('\n'),
        }),
      );
    });
  });

  describe('WS subscriber adapter', () => {
    it('VALID: {EventsOn adapter in responder} => renders side-channel note line not → line', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/server' });

      proxy.setupStartupFiles({ names: ['start-server.ts'] });
      proxy.setupFileContentsMap({
        map: {
          'start-server.ts': ContentTextStub({
            value: `import { serverFlow } from '../flows/server/server-flow';`,
          }),
          'server-flow.ts': ContentTextStub({
            value: `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
          }),
          'server-init-responder.ts': ContentTextStub({
            value: `import { orchestratorEventsOnAdapter } from '../../../adapters/orchestrator/events-on/orchestrator-events-on-adapter';`,
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
            'startup/start-server',
            '  ↳ flows/{server}',
            '',
            'flows/server/server-flow',
            '  ↳ server-init-responder',
            '      + adapters/orchestrator/events-on/orchestrator-events-on-adapter    ← runtime FLOW shown in Side-channel',
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
          'start-server.ts': ContentTextStub({ value: '' }),
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        ContentTextStub({
          value: ['## Boot', '', '```', 'startup/start-server', '```'].join('\n'),
        }),
      );
    });
  });
});
