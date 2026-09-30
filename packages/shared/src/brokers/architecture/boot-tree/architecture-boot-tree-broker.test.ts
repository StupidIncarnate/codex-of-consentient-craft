import { architectureBootTreeBroker } from './architecture-boot-tree-broker';
import { architectureBootTreeBrokerProxy } from './architecture-boot-tree-broker.proxy';

describe('architectureBootTreeBroker', () => {
  describe('single startup → single flow → single responder → single broker', () => {
    it('VALID: {simple startup→flow→responder→broker chain} => renders clean boot tree', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = '/repo/packages/server';

      proxy.setupStartupFiles({ packageRoot, names: ['start-server.ts'] });
      proxy.setupFileContentsMap({
        map: {
          'start-server.ts': [
              `import { serverFlow } from '../flows/server/server-flow';`,
              `export const startServer = () => {};`,
            ].join('\n'),
          'server-flow.ts': [
              `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
              `export const serverFlow = () => {};`,
            ].join('\n'),
          'server-init-responder.ts': [
              `import { serverInitBroker } from '../../../brokers/server/init/server-init-broker';`,
              `export const serverInitResponder = () => {};`,
            ].join('\n'),
          'server-init-broker.ts': `export const serverInitBroker = () => {};`,
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        [
            '## Boot',
            '',
            '```',
            'startServer',
            '  ↳ flows/{serverFlow}',
            '',
            'serverFlow',
            '  ↳ serverInitResponder',
            '      → serverInitBroker',
            '```',
          ].join('\n'),
      );
    });
  });

  describe('multi-flow startup', () => {
    it('VALID: {startup with three flows} => expands flows/{questFlow, guildFlow, healthFlow}', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = '/repo/packages/server';

      proxy.setupStartupFiles({ packageRoot, names: ['start-server.ts'] });
      proxy.setupFileContentsMap({
        map: {
          'start-server.ts': [
              `import { questFlow } from '../flows/quest/quest-flow';`,
              `import { guildFlow } from '../flows/guild/guild-flow';`,
              `import { healthFlow } from '../flows/health/health-flow';`,
              `export const startServer = () => {};`,
            ].join('\n'),
          'quest-flow.ts': `export const questFlow = () => {};`,
          'guild-flow.ts': `export const guildFlow = () => {};`,
          'health-flow.ts': `export const healthFlow = () => {};`,
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        [
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
      );
    });
  });

  describe('layer file inlining', () => {
    it('VALID: {flow imports entry + layer responder} => layer file absent from ↳ lines', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = '/repo/packages/server';

      proxy.setupStartupFiles({ packageRoot, names: ['start-server.ts'] });
      proxy.setupFileContentsMap({
        map: {
          'start-server.ts': [
              `import { serverFlow } from '../flows/server/server-flow';`,
              `export const startServer = () => {};`,
            ].join('\n'),
          'server-flow.ts': [
              `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
              `import { serverValidateLayerResponder } from '../../responders/server/init/server-validate-layer-responder';`,
              `export const serverFlow = () => {};`,
            ].join('\n'),
          'server-init-responder.ts': `export const serverInitResponder = () => {};`,
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        [
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
      );
    });
  });

  describe('WS subscriber broker', () => {
    it('VALID: {EventsOn broker in responder} => renders as a regular → broker leaf', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = '/repo/packages/server';

      proxy.setupStartupFiles({ packageRoot, names: ['start-server.ts'] });
      proxy.setupFileContentsMap({
        map: {
          'start-server.ts': [
              `import { serverFlow } from '../flows/server/server-flow';`,
              `export const startServer = () => {};`,
            ].join('\n'),
          'server-flow.ts': [
              `import { serverInitResponder } from '../../responders/server/init/server-init-responder';`,
              `export const serverFlow = () => {};`,
            ].join('\n'),
          'server-init-responder.ts': [
              `import { orchestratorEventsOnBroker } from '../../../brokers/orchestrator/events-on/orchestrator-events-on-broker';`,
              `export const serverInitResponder = () => {};`,
            ].join('\n'),
          'orchestrator-events-on-broker.ts': `export const orchestratorEventsOnBroker = () => {};`,
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        [
            '## Boot',
            '',
            '```',
            'startServer',
            '  ↳ flows/{serverFlow}',
            '',
            'serverFlow',
            '  ↳ serverInitResponder',
            '      → orchestratorEventsOnBroker',
            '```',
          ].join('\n'),
      );
    });
  });

  describe('no startup files', () => {
    it('EMPTY: {package with no startup files} => returns placeholder', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = '/repo/packages/library';

      proxy.setupNoStartupFiles({ packageRoot });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        '## Boot\n\n```\n(no startup files found)\n```',
      );
    });
  });

  describe('test and proxy file filtering', () => {
    it('VALID: {startup dir with proxy file} => proxy file absent from output', () => {
      const proxy = architectureBootTreeBrokerProxy();
      const packageRoot = '/repo/packages/server';

      proxy.setupStartupFiles({
        packageRoot,
        names: ['start-server.ts', 'start-server.proxy.ts'],
      });
      proxy.setupFileContentsMap({
        map: {
          'start-server.ts': `export const startServer = () => {};`,
        },
      });

      const result = architectureBootTreeBroker({ packageRoot });

      expect(result).toBe(
        ['## Boot', '', '```', 'startServer', '```'].join('\n'),
      );
    });
  });
});
