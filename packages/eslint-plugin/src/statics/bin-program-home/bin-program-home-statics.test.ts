import { binProgramHomeStatics } from './bin-program-home-statics';

describe('binProgramHomeStatics', () => {
  it('VALID: {} => names one bin function per program with a @<scope>/bin home', () => {
    expect(binProgramHomeStatics.programs).toStrictEqual({
      git: { binFunction: 'currentBranch' },
      npm: { binFunction: 'install' },
      claude: { binFunction: 'spawnStreamJson' },
      cp: { binFunction: 'copyRecursive' },
      lsof: { binFunction: 'listeningPids' },
      kill: { binFunction: 'killPid' },
    });
  });
});
