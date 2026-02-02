import { eventEmittingProcessContract } from './event-emitting-process-contract';
import { EventEmittingProcessStub } from './event-emitting-process.stub';

describe('eventEmittingProcessContract', () => {
  it('VALID: {default} => creates process with default handlers', () => {
    const process = EventEmittingProcessStub();

    expect(process.kill).toBeDefined();
    expect(process.on).toBeDefined();
    expect(typeof process.kill).toBe('function');
    expect(typeof process.on).toBe('function');
  });

  it('VALID: {exitCode: 0} => emits exit event with code', async () => {
    const process = EventEmittingProcessStub({ exitCode: 0 });

    const exitCode = await new Promise((resolve) => {
      process.on('exit', (code: unknown) => {
        resolve(code);
      });
    });

    expect(exitCode).toBe(0);
  });

  it('VALID: {exitCode: 1} => emits exit event with non-zero code', async () => {
    const process = EventEmittingProcessStub({ exitCode: 1 });

    const exitCode = await new Promise((resolve) => {
      process.on('exit', (code: unknown) => {
        resolve(code);
      });
    });

    expect(exitCode).toBe(1);
  });

  it('VALID: {error: Error} => emits error event', async () => {
    const testError = new Error('Test error');
    const process = EventEmittingProcessStub({ error: testError });

    const receivedError = await new Promise((resolve) => {
      process.on('error', (error: unknown) => {
        resolve(error);
      });
    });

    expect(receivedError).toBe(testError);
  });

  it('VALID: {kill: custom} => uses custom kill handler', () => {
    const customKill = jest.fn().mockReturnValue(false);
    const process = EventEmittingProcessStub({ kill: customKill });

    const result = process.kill();

    expect(result).toBe(false);
    expect(customKill).toHaveBeenCalledWith();
  });

  it('VALID: {default kill} => default kill returns true', () => {
    const process = EventEmittingProcessStub();

    const result = process.kill();

    expect(result).toBe(true);
  });

  it('VALID: contract.parse => validates object shape using stub', () => {
    const stubProcess = EventEmittingProcessStub();

    const result = eventEmittingProcessContract.parse(stubProcess);

    expect(result.kill).toBeDefined();
    expect(result.on).toBeDefined();
  });
});
