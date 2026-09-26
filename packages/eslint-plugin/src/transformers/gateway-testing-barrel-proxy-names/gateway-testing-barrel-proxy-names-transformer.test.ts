import { FileContentsStub, IdentifierStub } from '@dungeonmaster/shared/contracts';
import { gatewayTestingBarrelProxyNamesTransformer } from './gateway-testing-barrel-proxy-names-transformer';

describe('gatewayTestingBarrelProxyNamesTransformer', () => {
  it('VALID: {content: several export lines} => returns every re-exported Proxy name', () => {
    const content = FileContentsStub({
      value: `
        export { globProxy } from '../glob/glob.proxy';
        export { renderProxy } from '../@testing-library/react/render.proxy';
        export { parseXmlProxy } from '../fast-xml-parser/parse-xml.proxy';
      `,
    });

    const result = gatewayTestingBarrelProxyNamesTransformer({ content });

    expect(result).toStrictEqual(
      new Set([
        IdentifierStub({ value: 'globProxy' }),
        IdentifierStub({ value: 'renderProxy' }),
        IdentifierStub({ value: 'parseXmlProxy' }),
      ]),
    );
  });

  it('EDGE: {content: a re-export whose local name does not end in Proxy} => excludes it', () => {
    const content = FileContentsStub({
      value: `
        export { globProxy } from '../glob/glob.proxy';
        export { isFsError } from '../fs/is-fs-error';
      `,
    });

    const result = gatewayTestingBarrelProxyNamesTransformer({ content });

    expect(result).toStrictEqual(new Set([IdentifierStub({ value: 'globProxy' })]));
  });

  it('EMPTY: {content: no export statements} => returns an empty set', () => {
    const content = FileContentsStub({
      value: `
        // Empty until a wrapped module needs a proxy a caller can import.
      `,
    });

    const result = gatewayTestingBarrelProxyNamesTransformer({ content });

    expect(result).toStrictEqual(new Set());
  });
});
