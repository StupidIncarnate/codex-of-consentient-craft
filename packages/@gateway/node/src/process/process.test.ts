import {
  stdout,
  stderr,
  argv,
  pid,
  platform,
  execPath,
  envSnapshot,
  setEnv,
  deleteEnv,
  chdir,
  nextTick,
  removeAllListeners,
  emit,
  on,
} from './process';

describe('#gateway/node/process', () => {
  it('VALID: {stdout, stderr} => are the same Writable objects Node provides', () => {
    expect(stdout).toBe(process.stdout);
    expect(stderr).toBe(process.stderr);
  });

  it('VALID: {argv} => is the same array Node provides', () => {
    expect(argv).toBe(process.argv);
  });

  it('VALID: {pid} => is the same value process.pid holds', () => {
    expect(pid).toBe(process.pid);
  });

  it('VALID: {platform, execPath} => are the same values Node provides', () => {
    expect(platform).toBe(process.platform);
    expect(execPath).toBe(process.execPath);
  });

  it('VALID: {env and event wrappers} => the barrel re-exports every one as a function', () => {
    expect({
      envSnapshot,
      setEnv,
      deleteEnv,
      chdir,
      nextTick,
      removeAllListeners,
      emit,
      on,
    }).toStrictEqual({
      envSnapshot: expect.any(Function),
      setEnv: expect.any(Function),
      deleteEnv: expect.any(Function),
      chdir: expect.any(Function),
      nextTick: expect.any(Function),
      removeAllListeners: expect.any(Function),
      emit: expect.any(Function),
      on: expect.any(Function),
    });
  });
});
