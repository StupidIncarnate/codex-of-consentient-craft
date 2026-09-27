import { FileContentsStub, IdentifierStub, ModulePathStub } from '@dungeonmaster/shared/contracts';
import { gatewayTestingBarrelProxyPathsTransformer } from './gateway-testing-barrel-proxy-paths-transformer';

describe('gatewayTestingBarrelProxyPathsTransformer', () => {
  it('VALID: {content: several export lines} => returns every re-exported Proxy name mapped to its path', () => {
    const content = FileContentsStub({
      value: `
        export { globProxy } from './glob/glob.proxy';
        export { renderProxy } from './@testing-library/react/render.proxy';
        export { parseXmlProxy } from './fast-xml-parser/parse-xml.proxy';
      `,
    });

    const result = gatewayTestingBarrelProxyPathsTransformer({ content });

    expect(result).toStrictEqual(
      new Map([
        [IdentifierStub({ value: 'globProxy' }), ModulePathStub({ value: 'glob/glob.proxy' })],
        [
          IdentifierStub({ value: 'renderProxy' }),
          ModulePathStub({ value: '@testing-library/react/render.proxy' }),
        ],
        [
          IdentifierStub({ value: 'parseXmlProxy' }),
          ModulePathStub({ value: 'fast-xml-parser/parse-xml.proxy' }),
        ],
      ]),
    );
  });

  it('EDGE: {content: a re-export whose local name does not end in Proxy} => excludes it', () => {
    const content = FileContentsStub({
      value: `
        export { globProxy } from './glob/glob.proxy';
        export { isFsError } from './fs/is-fs-error';
      `,
    });

    const result = gatewayTestingBarrelProxyPathsTransformer({ content });

    expect(result).toStrictEqual(
      new Map([
        [IdentifierStub({ value: 'globProxy' }), ModulePathStub({ value: 'glob/glob.proxy' })],
      ]),
    );
  });

  it('EMPTY: {content: no export statements} => returns an empty map', () => {
    const content = FileContentsStub({
      value: `
        // Empty until a wrapped module needs a proxy a caller can import.
      `,
    });

    const result = gatewayTestingBarrelProxyPathsTransformer({ content });

    expect(result).toStrictEqual(new Map());
  });
});
