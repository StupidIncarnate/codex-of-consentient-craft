import * as nodeTesting from './index';

const SYNC_FS_PROXY_EXPORTS = [
  ['isFsErrorProxy', nodeTesting.isFsErrorProxy],
  ['existsSyncProxy', nodeTesting.existsSyncProxy],
  ['readFileSyncProxy', nodeTesting.readFileSyncProxy],
  ['readFileSyncIfExistsProxy', nodeTesting.readFileSyncIfExistsProxy],
  ['readJsonFileSyncProxy', nodeTesting.readJsonFileSyncProxy],
  ['readJsonFileSyncIfExistsProxy', nodeTesting.readJsonFileSyncIfExistsProxy],
  ['statSyncProxy', nodeTesting.statSyncProxy],
  ['readdirSyncProxy', nodeTesting.readdirSyncProxy],
  ['writeFileSyncProxy', nodeTesting.writeFileSyncProxy],
  ['ensureDirSyncProxy', nodeTesting.ensureDirSyncProxy],
  ['findUpSyncProxy', nodeTesting.findUpSyncProxy],
] as const;

const CURATED_MODULE_PROXY_EXPORTS = [
  ['resolvePackageRootProxy', nodeTesting.resolvePackageRootProxy],
  ['isPortFreeProxy', nodeTesting.isPortFreeProxy],
  ['freePortPairProxy', nodeTesting.freePortPairProxy],
  ['unixSocketRequestProxy', nodeTesting.unixSocketRequestProxy],
  ['unixSocketServeProxy', nodeTesting.unixSocketServeProxy],
  ['questionProxy', nodeTesting.questionProxy],
  ['lineReaderProxy', nodeTesting.lineReaderProxy],
  ['fetchJsonProxy', nodeTesting.fetchJsonProxy],
  ['fetchOkProxy', nodeTesting.fetchOkProxy],
  ['fetchWithStatusProxy', nodeTesting.fetchWithStatusProxy],
  ['readStdinToEndProxy', nodeTesting.readStdinToEndProxy],
  ['getEnvProxy', nodeTesting.getEnvProxy],
  ['dynamicImportProxy', nodeTesting.dynamicImportProxy],
  ['cwdProxy', nodeTesting.cwdProxy],
  ['exitProxy', nodeTesting.exitProxy],
  ['onProxy', nodeTesting.onProxy],
  ['killProxy', nodeTesting.killProxy],
  ['getExitCodeProxy', nodeTesting.getExitCodeProxy],
  ['setExitCodeProxy', nodeTesting.setExitCodeProxy],
] as const;

describe('@dungeonmaster/node/_test_', () => {
  it.each(SYNC_FS_PROXY_EXPORTS)(
    'VALID: {export: %s} => is re-exported as a function',
    (_name, value) => {
      expect(value).toStrictEqual(expect.any(Function));
    },
  );

  it.each(CURATED_MODULE_PROXY_EXPORTS)(
    'VALID: {export: %s} => is re-exported as a function',
    (_name, value) => {
      expect(value).toStrictEqual(expect.any(Function));
    },
  );
});
