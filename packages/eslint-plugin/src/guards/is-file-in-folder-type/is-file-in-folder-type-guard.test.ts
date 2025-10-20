import { isFileInFolderTypeGuard } from './is-file-in-folder-type-guard';

describe('isFileInFolderTypeGuard', () => {
  it('VALID: {filename: "src/contracts/user/user-contract.ts", folderType: "contracts", suffix: "contract"} => returns true', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/contracts/user/user-contract.ts',
        folderType: 'contracts',
        suffix: 'contract',
      }),
    ).toBe(true);
  });

  it('VALID: {filename: "src/contracts/user/user-contract.tsx", folderType: "contracts", suffix: "contract"} => returns true', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/contracts/user/user-contract.tsx',
        folderType: 'contracts',
        suffix: 'contract',
      }),
    ).toBe(true);
  });

  it('VALID: {filename: "src/statics/user/user-statics.ts", folderType: "statics", suffix: "statics"} => returns true', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/statics/user/user-statics.ts',
        folderType: 'statics',
        suffix: 'statics',
      }),
    ).toBe(true);
  });

  it('VALID: {filename: "src/guards/is-admin/is-admin-guard.ts", folderType: "guards", suffix: "guard"} => returns true', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/guards/is-admin/is-admin-guard.ts',
        folderType: 'guards',
        suffix: 'guard',
      }),
    ).toBe(true);
  });

  it('VALID: {filename: "src/transformers/format-date/format-date-transformer.ts", folderType: "transformers", suffix: "transformer"} => returns true', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/transformers/format-date/format-date-transformer.ts',
        folderType: 'transformers',
        suffix: 'transformer',
      }),
    ).toBe(true);
  });

  it('VALID: {filename: "/project/src/brokers/user/user-broker.ts", folderType: "brokers", suffix: "broker"} => returns true', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: '/project/src/brokers/user/user-broker.ts',
        folderType: 'brokers',
        suffix: 'broker',
      }),
    ).toBe(true);
  });

  it('INVALID: {filename: "src/contracts/user/user.ts", folderType: "contracts", suffix: "contract"} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/contracts/user/user.ts',
        folderType: 'contracts',
        suffix: 'contract',
      }),
    ).toBe(false);
  });

  it('INVALID: {filename: "src/guards/user/user-contract.ts", folderType: "contracts", suffix: "contract"} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/guards/user/user-contract.ts',
        folderType: 'contracts',
        suffix: 'contract',
      }),
    ).toBe(false);
  });

  it('INVALID: {filename: "src/contracts/user/user-broker.ts", folderType: "contracts", suffix: "contract"} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/contracts/user/user-broker.ts',
        folderType: 'contracts',
        suffix: 'contract',
      }),
    ).toBe(false);
  });

  it('INVALID: {filename: "src/contracts/user/usercontract.ts", folderType: "contracts", suffix: "contract"} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/contracts/user/usercontract.ts',
        folderType: 'contracts',
        suffix: 'contract',
      }),
    ).toBe(false);
  });

  it('INVALID: {filename: "src/contracts/user/user-contract.js", folderType: "contracts", suffix: "contract"} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/contracts/user/user-contract.js',
        folderType: 'contracts',
        suffix: 'contract',
      }),
    ).toBe(false);
  });

  it('INVALID: {filename: "contracts/user/user-contract.ts", folderType: "contracts", suffix: "contract"} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'contracts/user/user-contract.ts',
        folderType: 'contracts',
        suffix: 'contract',
      }),
    ).toBe(false);
  });

  it('EMPTY: {filename: "", folderType: "contracts", suffix: "contract"} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: '',
        folderType: 'contracts',
        suffix: 'contract',
      }),
    ).toBe(false);
  });

  it('EMPTY: {filename: "src/contracts/user/user-contract.ts", folderType: "", suffix: "contract"} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/contracts/user/user-contract.ts',
        folderType: '',
        suffix: 'contract',
      }),
    ).toBe(false);
  });

  it('EMPTY: {filename: "src/contracts/user/user-contract.ts", folderType: "contracts", suffix: ""} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/contracts/user/user-contract.ts',
        folderType: 'contracts',
        suffix: '',
      }),
    ).toBe(false);
  });

  it('EMPTY: {folderType: "contracts", suffix: "contract"} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        folderType: 'contracts',
        suffix: 'contract',
      }),
    ).toBe(false);
  });

  it('EMPTY: {filename: "src/contracts/user/user-contract.ts", suffix: "contract"} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/contracts/user/user-contract.ts',
        suffix: 'contract',
      }),
    ).toBe(false);
  });

  it('EMPTY: {filename: "src/contracts/user/user-contract.ts", folderType: "contracts"} => returns false', () => {
    expect(
      isFileInFolderTypeGuard({
        filename: 'src/contracts/user/user-contract.ts',
        folderType: 'contracts',
      }),
    ).toBe(false);
  });

  it('EMPTY: {} => returns false', () => {
    expect(isFileInFolderTypeGuard({})).toBe(false);
  });
});
