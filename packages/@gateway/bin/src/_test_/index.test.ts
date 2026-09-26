import * as binTesting from './index';

const PROXY_EXPORTS = [
  ['currentBranchProxy', binTesting.currentBranchProxy],
  ['addAllProxy', binTesting.addAllProxy],
  ['commitProxy', binTesting.commitProxy],
  ['pushProxy', binTesting.pushProxy],
  ['checkoutProxy', binTesting.checkoutProxy],
  ['branchDeleteProxy', binTesting.branchDeleteProxy],
  ['headShaProxy', binTesting.headShaProxy],
  ['upstreamShaProxy', binTesting.upstreamShaProxy],
  ['verifyRefProxy', binTesting.verifyRefProxy],
  ['diffFilesProxy', binTesting.diffFilesProxy],
  ['untrackedFilesProxy', binTesting.untrackedFilesProxy],
  ['logNameOnlyProxy', binTesting.logNameOnlyProxy],
  ['worktreeAddProxy', binTesting.worktreeAddProxy],
  ['worktreePruneProxy', binTesting.worktreePruneProxy],
  ['worktreeRemoveProxy', binTesting.worktreeRemoveProxy],
  ['detectDefaultBranchProxy', binTesting.detectDefaultBranchProxy],
  ['detectOriginDefaultBranchProxy', binTesting.detectOriginDefaultBranchProxy],
  ['installProxy', binTesting.installProxy],
  ['runBuildProxy', binTesting.runBuildProxy],
  ['runScriptProxy', binTesting.runScriptProxy],
  ['listeningPidsProxy', binTesting.listeningPidsProxy],
  ['killPidProxy', binTesting.killPidProxy],
  ['killGroupProxy', binTesting.killGroupProxy],
  ['copyRecursiveProxy', binTesting.copyRecursiveProxy],
] as const;

describe('@dungeonmaster/bin/_test_', () => {
  it.each(PROXY_EXPORTS)('VALID: {export: %s} => is re-exported as a function', (_name, value) => {
    expect(value).toStrictEqual(expect.any(Function));
  });
});
