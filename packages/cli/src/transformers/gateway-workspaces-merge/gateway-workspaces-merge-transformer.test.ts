import { PackageJsonRawStub } from '@dungeonmaster/shared/contracts/package-json-raw/package-json-raw.stub';
import { gatewayWorkspacesMergeTransformer } from './gateway-workspaces-merge-transformer';

describe('gatewayWorkspacesMergeTransformer', () => {
  it('VALID: {workspaces: ["packages/*"]} => appends packages/@gateway/* after the existing entry', () => {
    const rootPackageJson = PackageJsonRawStub({ workspaces: ['packages/*'] });

    const result = gatewayWorkspacesMergeTransformer({ rootPackageJson });

    expect(result).toStrictEqual({
      name: 'stub-project',
      version: '1.0.0',
      workspaces: ['packages/*', 'packages/@gateway/*'],
    });
  });

  it('VALID: {workspaces: multiple existing entries} => keeps every entry and its order, appending at the end', () => {
    const rootPackageJson = PackageJsonRawStub({
      workspaces: ['packages/*', 'tools/*'],
    });

    const result = gatewayWorkspacesMergeTransformer({ rootPackageJson });

    expect(result).toStrictEqual({
      name: 'stub-project',
      version: '1.0.0',
      workspaces: ['packages/*', 'tools/*', 'packages/@gateway/*'],
    });
  });

  it('EMPTY: {workspaces: absent} => creates workspaces with only packages/@gateway/*', () => {
    const rootPackageJson = PackageJsonRawStub({});

    const result = gatewayWorkspacesMergeTransformer({ rootPackageJson });

    expect(result).toStrictEqual({
      name: 'stub-project',
      version: '1.0.0',
      workspaces: ['packages/@gateway/*'],
    });
  });

  it('VALID: {workspaces: already includes packages/@gateway/*} => returns the same reference unchanged', () => {
    const rootPackageJson = PackageJsonRawStub({
      workspaces: ['packages/*', 'packages/@gateway/*'],
    });

    const result = gatewayWorkspacesMergeTransformer({ rootPackageJson });

    expect(result).toBe(rootPackageJson);
  });
});
