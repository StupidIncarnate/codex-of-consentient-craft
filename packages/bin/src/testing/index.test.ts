import * as binTesting from './index';

const PROXY_EXPORTS = [
  ['gitCurrentBranchProxy', binTesting.gitCurrentBranchProxy],
  ['gitAddAllProxy', binTesting.gitAddAllProxy],
  ['gitCommitProxy', binTesting.gitCommitProxy],
  ['gitPushProxy', binTesting.gitPushProxy],
  ['gitCheckoutProxy', binTesting.gitCheckoutProxy],
  ['gitBranchDeleteProxy', binTesting.gitBranchDeleteProxy],
  ['gitHeadShaProxy', binTesting.gitHeadShaProxy],
  ['gitUpstreamShaProxy', binTesting.gitUpstreamShaProxy],
  ['gitVerifyRefProxy', binTesting.gitVerifyRefProxy],
  ['gitDiffFilesProxy', binTesting.gitDiffFilesProxy],
  ['gitUntrackedFilesProxy', binTesting.gitUntrackedFilesProxy],
  ['gitLogNameOnlyProxy', binTesting.gitLogNameOnlyProxy],
  ['gitWorktreeAddProxy', binTesting.gitWorktreeAddProxy],
  ['gitWorktreePruneProxy', binTesting.gitWorktreePruneProxy],
  ['gitWorktreeRemoveProxy', binTesting.gitWorktreeRemoveProxy],
  ['gitDetectDefaultBranchProxy', binTesting.gitDetectDefaultBranchProxy],
  ['gitDetectOriginDefaultBranchProxy', binTesting.gitDetectOriginDefaultBranchProxy],
  ['npmInstallProxy', binTesting.npmInstallProxy],
  ['npmRunBuildProxy', binTesting.npmRunBuildProxy],
  ['npmRunScriptProxy', binTesting.npmRunScriptProxy],
  ['lsofListeningPidsProxy', binTesting.lsofListeningPidsProxy],
  ['killPidProxy', binTesting.killPidProxy],
  ['killGroupProxy', binTesting.killGroupProxy],
  ['cpCopyRecursiveProxy', binTesting.cpCopyRecursiveProxy],
] as const;

describe('@dungeonmaster/bin/testing', () => {
  it.each(PROXY_EXPORTS)('VALID: {export: %s} => is re-exported as a function', (_name, value) => {
    expect(value).toStrictEqual(expect.any(Function));
  });
});
