import { packageJsonReadBroker } from './package-json-read-broker';
import { packageJsonReadBrokerProxy } from './package-json-read-broker.proxy';

describe('packageJsonReadBroker', () => {
  it('VALID: {filePath holding a package.json with dependencies} => returns the parsed dependencies map', () => {
    const proxy = packageJsonReadBrokerProxy();
    proxy.returns({
      filePath: '/repo/package.json',
      contents: '{"name":"root","dependencies":{"zod":"*"}}',
    });

    const result = packageJsonReadBroker({ filePath: '/repo/package.json' });

    expect(result.dependencies).toStrictEqual({ zod: '*' });
  });

  it('VALID: {filePath holding a private package.json} => returns private:true from the passthrough field', () => {
    const proxy = packageJsonReadBrokerProxy();
    proxy.returns({
      filePath: '/repo/packages/siegelense-recipes/package.json',
      contents: '{"name":"@dungeonmaster/siegelense-recipes","private":true}',
    });

    const result = packageJsonReadBroker({
      filePath: '/repo/packages/siegelense-recipes/package.json',
    });

    expect(result.private).toBe(true);
  });
});
