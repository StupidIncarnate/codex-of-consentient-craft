import { modulePathContract as _modulePathContract } from './module-path-contract';
import { ModulePathStub } from './module-path.stub';

describe('modulePathContract', () => {
  it('VALID: "axios" => parses successfully', () => {
    const result = ModulePathStub({ value: 'axios' });

    expect(result).toBe('axios');
  });

  it('VALID: "@questmaestro/shared" => parses successfully', () => {
    const result = ModulePathStub({ value: '@questmaestro/shared' });

    expect(result).toBe('@questmaestro/shared');
  });

  it('VALID: "./my-module" => parses successfully', () => {
    const result = ModulePathStub({ value: './my-module' });

    expect(result).toBe('./my-module');
  });

  it('VALID: "../utils" => parses successfully', () => {
    const result = ModulePathStub({ value: '../utils' });

    expect(result).toBe('../utils');
  });

  it('VALID: "/usr/local/lib/module" => parses successfully', () => {
    const result = ModulePathStub({ value: '/usr/local/lib/module' });

    expect(result).toBe('/usr/local/lib/module');
  });
});
