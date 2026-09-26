import { gatewayFolderNamesStatics } from './gateway-folder-names-statics';

describe('gatewayFolderNamesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(gatewayFolderNamesStatics).toStrictEqual(['node', 'bin', 'browser']);
  });
});
