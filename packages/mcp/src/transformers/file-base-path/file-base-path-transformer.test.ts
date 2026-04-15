import { fileBasePathTransformer } from './file-base-path-transformer';
import { PathSegmentStub } from '@dungeonmaster/shared/contracts';

describe('fileBasePathTransformer', () => {
  it('VALID: removes .ts extension', () => {
    const filepath = PathSegmentStub({ value: '/test/user-broker.ts' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .test.ts extension', () => {
    const filepath = PathSegmentStub({ value: '/test/user-broker.test.ts' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .proxy.ts extension', () => {
    const filepath = PathSegmentStub({ value: '/test/user-broker.proxy.ts' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .integration.test.ts extension', () => {
    const filepath = PathSegmentStub({
      value: '/test/user-broker.integration.test.ts',
    });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .spec.ts extension', () => {
    const filepath = PathSegmentStub({ value: '/test/user-broker.spec.ts' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .tsx extension', () => {
    const filepath = PathSegmentStub({ value: '/test/component.tsx' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/component');
  });

  it('VALID: removes .test.tsx extension', () => {
    const filepath = PathSegmentStub({ value: '/test/component.test.tsx' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/component');
  });

  it('VALID: handles file with hyphenated name', () => {
    const filepath = PathSegmentStub({ value: '/test/user-fetch-broker.ts' });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-fetch-broker');
  });

  it('VALID: handles deeply nested paths', () => {
    const filepath = PathSegmentStub({
      value: '/test/brokers/user/fetch/user-fetch-broker.test.ts',
    });

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/brokers/user/fetch/user-fetch-broker');
  });

  describe('javascript extensions', () => {
    it('VALID: removes .js extension', () => {
      const filepath = PathSegmentStub({ value: '/test/user-broker.js' });

      const result = fileBasePathTransformer({ filepath });

      expect(result).toBe('/test/user-broker');
    });

    it('VALID: removes .jsx extension', () => {
      const filepath = PathSegmentStub({ value: '/test/component.jsx' });

      const result = fileBasePathTransformer({ filepath });

      expect(result).toBe('/test/component');
    });

    it('VALID: removes .test.js extension', () => {
      const filepath = PathSegmentStub({ value: '/test/user-broker.test.js' });

      const result = fileBasePathTransformer({ filepath });

      expect(result).toBe('/test/user-broker');
    });

    it('VALID: removes .proxy.jsx extension', () => {
      const filepath = PathSegmentStub({ value: '/test/component.proxy.jsx' });

      const result = fileBasePathTransformer({ filepath });

      expect(result).toBe('/test/component');
    });

    it('VALID: removes .integration.test.js extension', () => {
      const filepath = PathSegmentStub({
        value: '/test/user-broker.integration.test.js',
      });

      const result = fileBasePathTransformer({ filepath });

      expect(result).toBe('/test/user-broker');
    });
  });
});
