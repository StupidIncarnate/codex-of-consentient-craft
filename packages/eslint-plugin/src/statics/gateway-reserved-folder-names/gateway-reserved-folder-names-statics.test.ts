import { gatewayReservedFolderNamesStatics } from './gateway-reserved-folder-names-statics';

describe('gatewayReservedFolderNamesStatics', () => {
  it('VALID: {folders.testSupport} => is the reserved gateway-test-support folder name', () => {
    expect(gatewayReservedFolderNamesStatics.folders.testSupport).toBe('gateway-test-support');
  });
});
