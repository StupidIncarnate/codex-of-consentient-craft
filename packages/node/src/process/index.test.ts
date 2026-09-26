import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import {
  stdout,
  stderr,
  argv,
  cwd,
  pid,
  platform,
  execPath,
  kill,
  exit,
  getExitCode,
  setExitCode,
} from './index';

describe('@dungeonmaster/node/process', () => {
  it('VALID: {stdout, stderr} => are the same Writable objects Node provides', () => {
    expect(stdout).toBe(process.stdout);
    expect(stderr).toBe(process.stderr);
  });

  it('VALID: {argv} => is the same array Node provides', () => {
    expect(argv).toBe(process.argv);
  });

  it('VALID: {cwd()} => returns the same value process.cwd() does', () => {
    expect(cwd()).toBe(process.cwd());
  });

  it('VALID: {pid} => is the same value process.pid holds', () => {
    expect(pid).toBe(process.pid);
  });

  it('VALID: {platform, execPath} => are the same values Node provides', () => {
    expect(platform).toBe(process.platform);
    expect(execPath).toBe(process.execPath);
  });

  it('VALID: {kill(pid, 0)} => a live pid answers true without sending a real signal', () => {
    expect(kill(process.pid, 0)).toBe(true);
  });

  it('VALID: {getExitCode, setExitCode} => round-trip through the real process.exitCode', () => {
    setExitCode(0);

    expect(getExitCode()).toBe(0);
    expect(process.exitCode).toBe(0);
  });

  it('VALID: {exit(code)} => calls the real process.exit with that code', () => {
    const handle = registerSpyOn({ object: process, method: 'exit' });
    handle.calledWith([7]).returns(undefined as never);

    exit(7);

    expect(handle.callsMatching([7])).toStrictEqual([[7]]);
  });
});
