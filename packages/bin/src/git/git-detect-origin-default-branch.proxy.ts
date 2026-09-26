import { gitRunProxy } from './git-run.proxy';

export const gitDetectOriginDefaultBranchProxy = (): {
  setupOriginMainExists: () => void;
  setupOriginMasterExists: () => void;
  setupNeitherExists: () => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupOriginMainExists: (): void => {
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'origin/main'],
        exitCode: 0,
        output: '',
      });
    },
    setupOriginMasterExists: (): void => {
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'origin/main'],
        exitCode: 128,
        output: '',
      });
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'origin/master'],
        exitCode: 0,
        output: '',
      });
    },
    setupNeitherExists: (): void => {
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'origin/main'],
        exitCode: 128,
        output: '',
      });
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'origin/master'],
        exitCode: 128,
        output: '',
      });
    },
  };
};
