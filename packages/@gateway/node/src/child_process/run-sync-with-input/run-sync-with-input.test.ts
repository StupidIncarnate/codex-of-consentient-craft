import { runSyncWithInput } from './run-sync-with-input';
import { runSyncWithInputProxy } from './run-sync-with-input.proxy';

describe('runSyncWithInput()', () => {
  it('VALID: {child exits 0 with stdout only} => status 0, stdout kept apart from empty stderr', () => {
    const proxy = runSyncWithInputProxy();
    proxy.setupResult({
      command: 'hook',
      args: ['--a'],
      cwd: '/repo',
      status: 0,
      stdout: 'out\n',
      stderr: '',
    });

    const result = runSyncWithInput({ command: 'hook', args: ['--a'], cwd: '/repo', input: 'x' });

    expect(result).toStrictEqual({ status: 0, stdout: 'out\n', stderr: '', signal: null });
  });

  it('VALID: {child exits 2 with stderr only} => status 2 and the stderr text', () => {
    const proxy = runSyncWithInputProxy();
    proxy.setupResult({
      command: 'hook',
      args: [],
      cwd: '/repo',
      status: 2,
      stdout: '',
      stderr: 'BLOCKED\n',
    });

    const result = runSyncWithInput({ command: 'hook', args: [], cwd: '/repo', input: '{}' });

    expect(result).toStrictEqual({ status: 2, stdout: '', stderr: 'BLOCKED\n', signal: null });
  });

  it('VALID: {a signal ended the child} => status null and the signal named', () => {
    const proxy = runSyncWithInputProxy();
    proxy.setupResult({
      command: 'hook',
      args: [],
      cwd: '/repo',
      status: null,
      stdout: '',
      stderr: '',
      signal: 'SIGKILL',
    });

    const result = runSyncWithInput({ command: 'hook', args: [], cwd: '/repo', input: '' });

    expect(result).toStrictEqual({ status: null, stdout: '', stderr: '', signal: 'SIGKILL' });
  });

  it('VALID: {input given} => the child received exactly that input', () => {
    const proxy = runSyncWithInputProxy();
    proxy.setupResult({
      command: 'hook',
      args: [],
      cwd: '/repo',
      status: 0,
      stdout: '',
      stderr: '',
    });

    runSyncWithInput({ command: 'hook', args: [], cwd: '/repo', input: '{"tool":"Grep"}' });

    expect(proxy.getInputFor({ command: 'hook', args: [], cwd: '/repo' })).toBe('{"tool":"Grep"}');
  });

  it('VALID: {env given} => spawn receives that env', () => {
    const proxy = runSyncWithInputProxy();
    proxy.setupResult({
      command: 'hook',
      args: [],
      cwd: '/repo',
      status: 0,
      stdout: '',
      stderr: '',
    });

    runSyncWithInput({ command: 'hook', args: [], cwd: '/repo', input: '', env: { ONLY: 'this' } });

    expect(proxy.getSpawnedEnvFor({ command: 'hook', args: [], cwd: '/repo' })).toStrictEqual({
      ONLY: 'this',
    });
  });

  it('EMPTY: {env omitted} => spawn options carry no env', () => {
    const proxy = runSyncWithInputProxy();
    proxy.setupResult({
      command: 'hook',
      args: [],
      cwd: '/repo',
      status: 0,
      stdout: '',
      stderr: '',
    });

    runSyncWithInput({ command: 'hook', args: [], cwd: '/repo', input: '' });

    expect(proxy.getSpawnedEnvFor({ command: 'hook', args: [], cwd: '/repo' })).toBe(undefined);
  });
});
