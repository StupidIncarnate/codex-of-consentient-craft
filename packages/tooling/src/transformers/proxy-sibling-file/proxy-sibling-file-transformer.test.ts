import { proxySiblingFileTransformer } from './proxy-sibling-file-transformer';

describe('proxySiblingFileTransformer', () => {
  it('VALID: {a .ts file} => the .proxy.ts sibling', () => {
    const result = proxySiblingFileTransformer({
      file: 'packages/a/src/x/x-broker.ts',
    });

    expect(result).toBe('packages/a/src/x/x-broker.proxy.ts');
  });

  it('VALID: {a .tsx file} => the .proxy.tsx sibling', () => {
    const result = proxySiblingFileTransformer({
      file: 'packages/a/src/w/w-widget.tsx',
    });

    expect(result).toBe('packages/a/src/w/w-widget.proxy.tsx');
  });
});
