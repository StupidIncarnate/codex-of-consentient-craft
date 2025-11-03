import { fileBasePathTransformer } from './file-base-path-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';

describe('fileBasePathTransformer', () => {
  it('VALID: removes .ts extension', () => {
    const filepath = AbsoluteFilePathStub({ value: '/test/user-broker.ts' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .test.ts extension', () => {
    const filepath = AbsoluteFilePathStub({ value: '/test/user-broker.test.ts' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .proxy.ts extension', () => {
    const filepath = AbsoluteFilePathStub({ value: '/test/user-broker.proxy.ts' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .integration.test.ts extension', () => {
    const filepath = AbsoluteFilePathStub({
      value: '/test/user-broker.integration.test.ts',
    });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .spec.ts extension', () => {
    const filepath = AbsoluteFilePathStub({ value: '/test/user-broker.spec.ts' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .tsx extension', () => {
    const filepath = AbsoluteFilePathStub({ value: '/test/component.tsx' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/component');
  });

  it('VALID: removes .test.tsx extension', () => {
    const filepath = AbsoluteFilePathStub({ value: '/test/component.test.tsx' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/component');
  });

  it('VALID: handles file with hyphenated name', () => {
    const filepath = AbsoluteFilePathStub({ value: '/test/user-fetch-broker.ts' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-fetch-broker');
  });

  it('VALID: handles deeply nested paths', () => {
    const filepath = AbsoluteFilePathStub({
      value: '/test/brokers/user/fetch/user-fetch-broker.test.ts',
    });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/brokers/user/fetch/user-fetch-broker');
  });
});
