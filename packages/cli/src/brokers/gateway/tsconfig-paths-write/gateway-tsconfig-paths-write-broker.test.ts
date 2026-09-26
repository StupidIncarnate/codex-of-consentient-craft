import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { TsconfigPathsMapStub } from '../../../contracts/tsconfig-paths-map/tsconfig-paths-map.stub';
import { gatewayTsconfigPathsWriteBroker } from './gateway-tsconfig-paths-write-broker';
import { gatewayTsconfigPathsWriteBrokerProxy } from './gateway-tsconfig-paths-write-broker.proxy';

describe('gatewayTsconfigPathsWriteBroker', () => {
  it('EMPTY: {tsconfigPath: missing file} => returns false without reading or writing', async () => {
    const proxy = gatewayTsconfigPathsWriteBrokerProxy();
    const tsconfigPath = FilePathStub({ value: '/repo/tsconfig.build.json' });
    proxy.setupMissingFile({ tsconfigPath });

    const result = await gatewayTsconfigPathsWriteBroker({
      tsconfigPath,
      entries: TsconfigPathsMapStub(),
      skipWhenPathsMissing: false,
    });

    expect(result).toBe(false);
  });

  it('VALID: {skipWhenPathsMissing: true, file has no own paths} => returns false without writing', async () => {
    const proxy = gatewayTsconfigPathsWriteBrokerProxy();
    const tsconfigPath = FilePathStub({ value: '/repo/packages/app/tsconfig.json' });
    proxy.setupFileContent({
      tsconfigPath,
      content: `{
  "compilerOptions": {
    "noEmit": true
  }
}
`,
    });

    const result = await gatewayTsconfigPathsWriteBroker({
      tsconfigPath,
      entries: TsconfigPathsMapStub(),
      skipWhenPathsMissing: true,
    });

    expect(result).toBe(false);
    expect(proxy.getWrittenContent({ tsconfigPath })).toBe(undefined);
  });

  it('VALID: {skipWhenPathsMissing: false, file has no paths} => creates the paths block and writes it', async () => {
    const proxy = gatewayTsconfigPathsWriteBrokerProxy();
    const tsconfigPath = FilePathStub({ value: '/repo/packages/app/tsconfig.build.json' });
    proxy.setupFileContent({
      tsconfigPath,
      content: `{
  "compilerOptions": {
    "noEmit": false
  }
}
`,
    });

    const result = await gatewayTsconfigPathsWriteBroker({
      tsconfigPath,
      entries: TsconfigPathsMapStub({ '#gateway/npm/*': ['../@gateway/npm/dist/*/index.d.ts'] }),
      skipWhenPathsMissing: false,
    });

    expect(result).toBe(true);
    expect(proxy.getWrittenContent({ tsconfigPath })).toBe(`{
  "compilerOptions": {
    "noEmit": false,
    "paths": {
      "#gateway/npm/*": ["../@gateway/npm/dist/*/index.d.ts"]
    }
  }
}
`);
  });

  it('VALID: {skipWhenPathsMissing: true, file already declares its own paths, missing one entry} => merges the missing entry in and writes it', async () => {
    const proxy = gatewayTsconfigPathsWriteBrokerProxy();
    const tsconfigPath = FilePathStub({ value: '/repo/packages/app/tsconfig.json' });
    proxy.setupFileContent({
      tsconfigPath,
      content: `{
  "compilerOptions": {
    "paths": {
      "#alias/*": ["./src/*"]
    }
  }
}
`,
    });

    const result = await gatewayTsconfigPathsWriteBroker({
      tsconfigPath,
      entries: TsconfigPathsMapStub({ '#gateway/npm/*': ['../@gateway/npm/src/*/index.ts'] }),
      skipWhenPathsMissing: true,
    });

    expect(result).toBe(true);
    expect(proxy.getWrittenContent({ tsconfigPath })).toBe(`{
  "compilerOptions": {
    "paths": {
      "#alias/*": ["./src/*"],
      "#gateway/npm/*": ["../@gateway/npm/src/*/index.ts"]
    }
  }
}
`);
  });

  it('VALID: {every wanted entry already present} => returns false without writing', async () => {
    const proxy = gatewayTsconfigPathsWriteBrokerProxy();
    const tsconfigPath = FilePathStub({ value: '/repo/tsconfig.json' });
    proxy.setupFileContent({
      tsconfigPath,
      content: `{
  "compilerOptions": {
    "paths": {
      "#gateway/npm/*": ["./packages/@gateway/npm/src/*/index.ts"]
    }
  }
}
`,
    });

    const result = await gatewayTsconfigPathsWriteBroker({
      tsconfigPath,
      entries: TsconfigPathsMapStub({
        '#gateway/npm/*': ['./packages/@gateway/npm/src/*/index.ts'],
      }),
      skipWhenPathsMissing: false,
    });

    expect(result).toBe(false);
    expect(proxy.getWrittenContent({ tsconfigPath })).toBe(undefined);
  });
});
