import * as fsGateway from './index';

const EXPORTS = [
  ['isFsError', fsGateway.isFsError],
  ['FsErrorStub', fsGateway.FsErrorStub],
  ['existsSync', fsGateway.existsSync],
  ['readFileSync', fsGateway.readFileSync],
  ['readFileSyncIfExists', fsGateway.readFileSyncIfExists],
  ['readJsonFileSync', fsGateway.readJsonFileSync],
  ['readJsonFileSyncIfExists', fsGateway.readJsonFileSyncIfExists],
  ['statSync', fsGateway.statSync],
  ['readdirSync', fsGateway.readdirSync],
  ['readdirEntriesSync', fsGateway.readdirEntriesSync],
  ['writeFileSync', fsGateway.writeFileSync],
  ['appendFileSync', fsGateway.appendFileSync],
  ['ensureDirSync', fsGateway.ensureDirSync],
  ['findUpSync', fsGateway.findUpSync],
  ['rmSync', fsGateway.rmSync],
  ['unlinkSync', fsGateway.unlinkSync],
  ['symlinkSync', fsGateway.symlinkSync],
  ['realpathSync', fsGateway.realpathSync],
  ['globSync', fsGateway.globSync],
  ['walkFilesSync', fsGateway.walkFilesSync],
  ['openForAppendSync', fsGateway.openForAppendSync],
  ['closeSync', fsGateway.closeSync],
  ['tailFile', fsGateway.tailFile],
] as const;

describe('@dungeonmaster/node/fs', () => {
  it.each(EXPORTS)('VALID: {export: %s} => is re-exported as a function', (_name, value) => {
    expect(value).toStrictEqual(expect.any(Function));
  });
});
