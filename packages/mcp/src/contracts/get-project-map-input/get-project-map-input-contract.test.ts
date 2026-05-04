import { getProjectMapInputContract } from './get-project-map-input-contract';
import { GetProjectMapInputStub } from './get-project-map-input.stub';

describe('getProjectMapInputContract', () => {
  it('VALID: {packages: ["mcp"]} => parses successfully', () => {
    const result = GetProjectMapInputStub({ packages: ['mcp'] });

    expect(result).toStrictEqual({ packages: ['mcp'] });
  });

  it('VALID: {packages: ["mcp", "shared"]} => parses successfully with multiple names', () => {
    const result = GetProjectMapInputStub({ packages: ['mcp', 'shared'] });

    expect(result).toStrictEqual({ packages: ['mcp', 'shared'] });
  });

  it('INVALID: {packages omitted} => throws Required error', () => {
    expect(() => {
      getProjectMapInputContract.parse({});
    }).toThrow(/Required/u);
  });

  it('INVALID: {packages: []} => throws min-length error', () => {
    expect(() => {
      getProjectMapInputContract.parse({ packages: [] });
    }).toThrow(/at least 1 element/u);
  });

  it('INVALID: {packages: [""]} => throws min-length error on the package name', () => {
    expect(() => {
      getProjectMapInputContract.parse({ packages: [''] });
    }).toThrow(/at least 1 character/u);
  });

  it('INVALID: {packages, extra} => throws Unrecognized key error', () => {
    expect(() => {
      getProjectMapInputContract.parse({ packages: ['mcp'], extra: 'no' } as never);
    }).toThrow(/Unrecognized key/u);
  });
});
