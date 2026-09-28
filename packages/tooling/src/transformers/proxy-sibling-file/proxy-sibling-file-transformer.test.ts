import { proxySiblingFileTransformer } from './proxy-sibling-file-transformer';
import { CensusPathStub } from '../../contracts/census-path/census-path.stub';

describe('proxySiblingFileTransformer', () => {
  it('VALID: {a .ts file} => the .proxy.ts sibling', () => {
    const result = proxySiblingFileTransformer({
      file: CensusPathStub({ value: 'packages/a/src/x/x-broker.ts' }),
    });

    expect(result).toBe('packages/a/src/x/x-broker.proxy.ts');
  });

  it('VALID: {a .tsx file} => the .proxy.tsx sibling', () => {
    const result = proxySiblingFileTransformer({
      file: CensusPathStub({ value: 'packages/a/src/w/w-widget.tsx' }),
    });

    expect(result).toBe('packages/a/src/w/w-widget.proxy.tsx');
  });
});
