import { importEdgesLayerBroker } from './import-edges-layer-broker';
import { importEdgesLayerBrokerProxy } from './import-edges-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = '/repo';

const SERVER_PKG = ContentTextStub({ value: 'server' });
const WEB_PKG = ContentTextStub({ value: 'web' });
const SHARED_PKG = ContentTextStub({ value: 'shared' });
const ORCHESTRATOR_PKG = ContentTextStub({ value: 'orchestrator' });

describe('importEdgesLayerBroker', () => {
  describe('single consumer file importing one barrel', () => {
    it('VALID: {one file importing @dungeonmaster/shared/contracts} => barrel=contracts, importCount=1', () => {
      const proxy = importEdgesLayerBrokerProxy();

      const consumerFile = '/repo/packages/web/src/brokers/user/user-fetch-broker.ts';

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [WEB_PKG, SHARED_PKG],
        sourceFiles: [
          {
            path: consumerFile,
            source: ContentTextStub({
              value: `import { userContract } from '@dungeonmaster/shared/contracts';`,
            }),
          },
        ],
      });

      const result = importEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          consumerPackage: 'web',
          sourcePackage: 'shared',
          barrel: 'contracts',
          importCount: 1,
        },
      ]);
    });
  });

  describe('two files in same consumer importing same barrel', () => {
    it('VALID: {two files both importing @dungeonmaster/shared/contracts} => importCount=2', () => {
      const proxy = importEdgesLayerBrokerProxy();

      const fileA = '/repo/packages/server/src/brokers/quest/quest-get-broker.ts';
      const fileB = '/repo/packages/server/src/brokers/quest/quest-add-broker.ts';

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, SHARED_PKG],
        sourceFiles: [
          {
            path: fileA,
            source: ContentTextStub({
              value: `import { questContract } from '@dungeonmaster/shared/contracts';`,
            }),
          },
          {
            path: fileB,
            source: ContentTextStub({
              value: `import { questIdContract } from '@dungeonmaster/shared/contracts';`,
            }),
          },
        ],
      });

      const result = importEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          consumerPackage: 'server',
          sourcePackage: 'shared',
          barrel: 'contracts',
          importCount: 2,
        },
      ]);
    });
  });

  describe('adapter-wrapper imports excluded', () => {
    it('VALID: {file in packages/server/src/adapters/orchestrator/... importing @dungeonmaster/orchestrator} => excluded', () => {
      const proxy = importEdgesLayerBrokerProxy();

      const adapterFile = '/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts';

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, ORCHESTRATOR_PKG],
        sourceFiles: [
          {
            path: adapterFile,
            source: ContentTextStub({
              value: `import { StartOrchestrator } from '@dungeonmaster/orchestrator';`,
            }),
          },
        ],
      });

      const result = importEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('root-barrel import (no subpath)', () => {
    it('VALID: {import @dungeonmaster/orchestrator with no subpath} => barrel=empty string', () => {
      const proxy = importEdgesLayerBrokerProxy();

      const consumerFile = '/repo/packages/server/src/brokers/quest/quest-execute-broker.ts';

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, ORCHESTRATOR_PKG],
        sourceFiles: [
          {
            path: consumerFile,
            source: ContentTextStub({
              value: `import { StartOrchestrator } from '@dungeonmaster/orchestrator';`,
            }),
          },
        ],
      });

      const result = importEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          consumerPackage: 'server',
          sourcePackage: 'orchestrator',
          barrel: '',
          importCount: 1,
        },
      ]);
    });
  });

  describe('non-monorepo imports ignored', () => {
    it('VALID: {file importing react and zod but no @dungeonmaster/*} => returns empty array', () => {
      const proxy = importEdgesLayerBrokerProxy();

      const consumerFile = '/repo/packages/web/src/widgets/app/app-widget.tsx';

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [WEB_PKG, SHARED_PKG],
        sourceFiles: [
          {
            path: consumerFile,
            source: ContentTextStub({
              value: [
                `import React from 'react';`,
                `import { z } from 'zod';`,
                `import { useState } from 'react';`,
              ].join('\n'),
            }),
          },
        ],
      });

      const result = importEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('test and proxy files filtered', () => {
    it('VALID: {test file importing @dungeonmaster/shared/contracts} => filtered, returns empty array', () => {
      const proxy = importEdgesLayerBrokerProxy();

      const testFile = '/repo/packages/web/src/brokers/user/user-fetch-broker.test.ts';

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [WEB_PKG, SHARED_PKG],
        sourceFiles: [
          {
            path: testFile,
            source: ContentTextStub({
              value: `import { userContract } from '@dungeonmaster/shared/contracts';`,
            }),
          },
        ],
      });

      const result = importEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {proxy file importing @dungeonmaster/shared/contracts} => filtered, returns empty array', () => {
      const proxy = importEdgesLayerBrokerProxy();

      const proxyFile = '/repo/packages/web/src/brokers/user/user-fetch-broker.proxy.ts';

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [WEB_PKG, SHARED_PKG],
        sourceFiles: [
          {
            path: proxyFile,
            source: ContentTextStub({
              value: `import { userContract } from '@dungeonmaster/shared/contracts';`,
            }),
          },
        ],
      });

      const result = importEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('multiple barrels from same source produce separate edges', () => {
    it('VALID: {files importing shared/contracts and shared/statics} => two separate edges', () => {
      const proxy = importEdgesLayerBrokerProxy();

      const fileA = '/repo/packages/server/src/brokers/quest/quest-get-broker.ts';
      const fileB = '/repo/packages/server/src/statics/api/api-statics.ts';

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, SHARED_PKG],
        sourceFiles: [
          {
            path: fileA,
            source: ContentTextStub({
              value: `import { questContract } from '@dungeonmaster/shared/contracts';`,
            }),
          },
          {
            path: fileB,
            source: ContentTextStub({
              value: `import { projectMapStatics } from '@dungeonmaster/shared/statics';`,
            }),
          },
        ],
      });

      const result = importEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      const contractsEdge = result.find((e) => String(e.barrel) === 'contracts');
      const staticsEdge = result.find((e) => String(e.barrel) === 'statics');

      expect(contractsEdge).toStrictEqual({
        consumerPackage: 'server',
        sourcePackage: 'shared',
        barrel: 'contracts',
        importCount: 1,
      });

      expect(staticsEdge).toStrictEqual({
        consumerPackage: 'server',
        sourcePackage: 'shared',
        barrel: 'statics',
        importCount: 1,
      });

      expect(result).toStrictEqual([contractsEdge, staticsEdge]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {no packages} => returns empty array', () => {
      const proxy = importEdgesLayerBrokerProxy();

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [],
        sourceFiles: [],
      });

      const result = importEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {packages but no source files} => returns empty array', () => {
      const proxy = importEdgesLayerBrokerProxy();

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [WEB_PKG, SHARED_PKG],
        sourceFiles: [],
      });

      const result = importEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
