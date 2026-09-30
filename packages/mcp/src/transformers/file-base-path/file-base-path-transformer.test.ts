import { fileBasePathTransformer } from './file-base-path-transformer';

describe('fileBasePathTransformer', () => {
  it('VALID: removes .ts extension', () => {
    const filepath = '/test/user-broker.ts';

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .test.ts extension', () => {
    const filepath = '/test/user-broker.test.ts';

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .proxy.ts extension', () => {
    const filepath = '/test/user-broker.proxy.ts';

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .integration.test.ts extension', () => {
    const filepath = '/test/user-broker.integration.test.ts';

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .spec.ts extension', () => {
    const filepath = '/test/user-broker.spec.ts';

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-broker');
  });

  it('VALID: removes .tsx extension', () => {
    const filepath = '/test/component.tsx';

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/component');
  });

  it('VALID: removes .test.tsx extension', () => {
    const filepath = '/test/component.test.tsx';

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/component');
  });

  it('VALID: handles file with hyphenated name', () => {
    const filepath = '/test/user-fetch-broker.ts';

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/user-fetch-broker');
  });

  it('VALID: handles deeply nested paths', () => {
    const filepath = '/test/brokers/user/fetch/user-fetch-broker.test.ts';

    const result = fileBasePathTransformer({ filepath });

    expect(result).toBe('/test/brokers/user/fetch/user-fetch-broker');
  });

  describe('javascript extensions', () => {
    it('VALID: removes .js extension', () => {
      const filepath = '/test/user-broker.js';

      const result = fileBasePathTransformer({ filepath });

      expect(result).toBe('/test/user-broker');
    });

    it('VALID: removes .jsx extension', () => {
      const filepath = '/test/component.jsx';

      const result = fileBasePathTransformer({ filepath });

      expect(result).toBe('/test/component');
    });

    it('VALID: removes .test.js extension', () => {
      const filepath = '/test/user-broker.test.js';

      const result = fileBasePathTransformer({ filepath });

      expect(result).toBe('/test/user-broker');
    });

    it('VALID: removes .proxy.jsx extension', () => {
      const filepath = '/test/component.proxy.jsx';

      const result = fileBasePathTransformer({ filepath });

      expect(result).toBe('/test/component');
    });

    it('VALID: removes .integration.test.js extension', () => {
      const filepath = '/test/user-broker.integration.test.js';

      const result = fileBasePathTransformer({ filepath });

      expect(result).toBe('/test/user-broker');
    });
  });
});
