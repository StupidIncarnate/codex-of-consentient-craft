import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { TsconfigCompilerOptionsStub } from '../../../contracts/tsconfig-compiler-options/tsconfig-compiler-options.stub';
import { gatewayTsconfigCompilerOptionsWriteBroker } from './gateway-tsconfig-compiler-options-write-broker';
import { gatewayTsconfigCompilerOptionsWriteBrokerProxy } from './gateway-tsconfig-compiler-options-write-broker.proxy';

describe('gatewayTsconfigCompilerOptionsWriteBroker', () => {
  it('EMPTY: {tsconfigPath: missing file} => returns false without writing', async () => {
    const proxy = gatewayTsconfigCompilerOptionsWriteBrokerProxy();
    const tsconfigPath = FilePathStub({ value: '/repo/packages/app/tsconfig.build.json' });
    proxy.setupMissingFile({ tsconfigPath });

    const result = await gatewayTsconfigCompilerOptionsWriteBroker({
      tsconfigPath,
      options: TsconfigCompilerOptionsStub(),
    });

    expect(result).toBe(false);
  });

  it('VALID: {file with commonjs and a comment} => sets node16 resolution, keeps the comment, and returns true', async () => {
    const proxy = gatewayTsconfigCompilerOptionsWriteBrokerProxy();
    const tsconfigPath = FilePathStub({ value: '/repo/tsconfig.json' });
    proxy.setupFileContent({
      tsconfigPath,
      content: `{
  // shared settings
  "compilerOptions": {
    "module": "commonjs",
    "noEmit": true
  }
}
`,
    });

    const result = await gatewayTsconfigCompilerOptionsWriteBroker({
      tsconfigPath,
      options: TsconfigCompilerOptionsStub({
        module: 'node16',
        moduleResolution: 'node16',
        customConditions: ['source'],
      }),
    });

    expect(result).toBe(true);
    expect(proxy.getWrittenContent({ tsconfigPath })).toBe(`{
  // shared settings
  "compilerOptions": {
    "module": "node16",
    "noEmit": true,
    "customConditions": ["source"],
    "moduleResolution": "node16"
  }
}
`);
  });

  it('VALID: {file already holds every value} => returns false without writing', async () => {
    const proxy = gatewayTsconfigCompilerOptionsWriteBrokerProxy();
    const tsconfigPath = FilePathStub({ value: '/repo/packages/app/tsconfig.build.json' });
    proxy.setupFileContent({
      tsconfigPath,
      content: `{
  "compilerOptions": {
    "customConditions": ["gateway-dist", "source"]
  }
}
`,
    });

    const result = await gatewayTsconfigCompilerOptionsWriteBroker({
      tsconfigPath,
      options: TsconfigCompilerOptionsStub({ customConditions: ['gateway-dist', 'source'] }),
    });

    expect(result).toBe(false);
    expect(proxy.getWrittenContent({ tsconfigPath })).toBe(undefined);
  });
});
