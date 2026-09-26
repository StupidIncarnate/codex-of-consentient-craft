import { gitRunProxy } from './git-run.proxy';

export const detectDefaultBranchProxy = (): {
  setupMainExists: () => void;
  setupMasterExists: () => void;
  setupNeitherExists: () => void;
} => {
  const runProxy = gitRunProxy();

  return {
    setupMainExists: (): void => {
      runProxy.setupResult({ args: ['rev-parse', '--verify', 'main'], exitCode: 0, output: '' });
    },
    setupMasterExists: (): void => {
      runProxy.setupResult({ args: ['rev-parse', '--verify', 'main'], exitCode: 128, output: '' });
      runProxy.setupResult({ args: ['rev-parse', '--verify', 'master'], exitCode: 0, output: '' });
    },
    setupNeitherExists: (): void => {
      runProxy.setupResult({ args: ['rev-parse', '--verify', 'main'], exitCode: 128, output: '' });
      runProxy.setupResult({
        args: ['rev-parse', '--verify', 'master'],
        exitCode: 128,
        output: '',
      });
    },
  };
};
