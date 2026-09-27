import * as fsGateway from './fs';

const EXPORTS = [
  ['isFsError', fsGateway.isFsError],
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
  ['isWalkedFile', fsGateway.isWalkedFile],
  ['openForAppendSync', fsGateway.openForAppendSync],
  ['closeSync', fsGateway.closeSync],
  ['tailFile', fsGateway.tailFile],
] as const;

describe('#gateway/node/fs', () => {
  it.each(EXPORTS)('VALID: {export: %s} => is re-exported as a function', (_name, value) => {
    expect(value).toStrictEqual(expect.any(Function));
  });

  it('VALID: {export: walkedFileSchema} => is re-exported as a zod schema that parses a WalkedFile', () => {
    const walked = { path: '/repo/a.jsonl', sizeBytes: 12, modifiedAtMs: 0 };

    expect(fsGateway.walkedFileSchema.parse(walked)).toBe(walked);
  });
});
