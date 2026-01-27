import { eventEmittingProcessContract } from './event-emitting-process-contract';
import { EventEmittingProcessStub } from './event-emitting-process.stub';

describe('eventEmittingProcessContract', () => {
  describe('parse()', () => {
    describe('valid input', () => {
      it('VALID: {kill: () => true, on: jest.fn()} => parses and preserves function behavior', () => {
        const killFn = jest.fn().mockReturnValue(true);
        const onFn = jest.fn().mockReturnValue('on-result');

        const result = eventEmittingProcessContract.parse({
          kill: killFn,
          on: onFn,
        });

        expect(result.kill()).toBe(true);
        expect(killFn).toHaveBeenCalledTimes(1);

        const onResult = result.on('event', () => {});

        expect(onResult).toBe('on-result');
        expect(onFn).toHaveBeenCalledTimes(1);
      });

      it('VALID: {kill: () => false} => kill returns false', () => {
        const killFn = jest.fn().mockReturnValue(false);

        const result = eventEmittingProcessContract.parse({
          kill: killFn,
          on: jest.fn(),
        });

        expect(result.kill()).toBe(false);
      });
    });

    describe('invalid input', () => {
      it('INVALID_KILL: {kill: undefined, on: fn} => throws', () => {
        expect(() =>
          eventEmittingProcessContract.parse({
            on: jest.fn(),
          }),
        ).toThrow(/Required/u);
      });

      it('INVALID_ON: {kill: fn, on: undefined} => throws', () => {
        expect(() =>
          eventEmittingProcessContract.parse({
            kill: jest.fn(),
          }),
        ).toThrow(/Required/u);
      });

      it('INVALID_KILL: {kill: "not-a-function", on: fn} => throws', () => {
        expect(() =>
          eventEmittingProcessContract.parse({
            kill: 'not-a-function' as never,
            on: jest.fn(),
          }),
        ).toThrow(/Expected function, received string/u);
      });

      it('INVALID_ON: {kill: fn, on: "not-a-function"} => throws', () => {
        expect(() =>
          eventEmittingProcessContract.parse({
            kill: jest.fn(),
            on: 'not-a-function' as never,
          }),
        ).toThrow(/Expected function, received string/u);
      });
    });
  });

  describe('EventEmittingProcessStub()', () => {
    describe('default behavior', () => {
      it('VALID: {} => emits exit with code 0', async () => {
        const process = EventEmittingProcessStub();

        const exitCode = await new Promise<unknown>((resolve) => {
          process.on('exit', (code: unknown) => {
            resolve(code);
          });
        });

        expect(exitCode).toBe(0);
      });

      it('VALID: {} => kill returns true', () => {
        const process = EventEmittingProcessStub();

        expect(process.kill()).toBe(true);
      });

      it('VALID: {} => on returns undefined', () => {
        const process = EventEmittingProcessStub();

        const result = process.on('exit', jest.fn());

        expect(result).toBeUndefined();
      });
    });

    describe('custom exitCode', () => {
      it('VALID: {exitCode: 1} => emits exit with code 1', async () => {
        const process = EventEmittingProcessStub({ exitCode: 1 });

        const exitCode = await new Promise<unknown>((resolve) => {
          process.on('exit', (code: unknown) => {
            resolve(code);
          });
        });

        expect(exitCode).toBe(1);
      });

      it('VALID: {exitCode: 127} => emits exit with code 127', async () => {
        const process = EventEmittingProcessStub({ exitCode: 127 });

        const exitCode = await new Promise<unknown>((resolve) => {
          process.on('exit', (code: unknown) => {
            resolve(code);
          });
        });

        expect(exitCode).toBe(127);
      });
    });

    describe('error handling', () => {
      it('VALID: {error: Error} => emits error event with provided error', async () => {
        const testError = new Error('Test error');
        const process = EventEmittingProcessStub({ error: testError });

        const receivedError = await new Promise<Error>((resolve) => {
          process.on('error', (err: Error) => {
            resolve(err);
          });
        });

        expect(receivedError).toBe(testError);
      });

      it('VALID: {error: Error} => does not emit exit event', async () => {
        const testError = new Error('Test error');
        const process = EventEmittingProcessStub({ error: testError });
        const exitListener = jest.fn();

        process.on('exit', exitListener);

        await new Promise((resolve) => {
          setImmediate(resolve);
        });

        expect(exitListener).toHaveBeenCalledTimes(0);
      });
    });

    describe('custom functions', () => {
      it('VALID: {kill: customKill} => uses custom kill function', () => {
        const customKill = jest.fn().mockReturnValue(false);
        const process = EventEmittingProcessStub({ kill: customKill });

        const result = process.kill();

        expect(result).toBe(false);
        expect(customKill).toHaveBeenCalledTimes(1);
      });

      it('VALID: {on: customOn} => uses custom on function', () => {
        const customOn = jest.fn().mockReturnValue('custom-return');
        const process = EventEmittingProcessStub({ on: customOn });

        const listener = jest.fn();
        const result = process.on('test-event', listener);

        expect(result).toBe('custom-return');
        expect(customOn).toHaveBeenCalledTimes(1);
        expect(customOn).toHaveBeenCalledWith('test-event', listener);
      });
    });

    describe('listener registration', () => {
      it('VALID: {multiple listeners for same event} => all listeners receive event', async () => {
        const process = EventEmittingProcessStub({ exitCode: 42 });
        const listener1 = jest.fn();
        const listener2 = jest.fn();

        process.on('exit', listener1);
        process.on('exit', listener2);

        await new Promise((resolve) => {
          setImmediate(resolve);
        });

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener1).toHaveBeenCalledWith(42);
        expect(listener2).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledWith(42);
      });

      it('EDGE: {listener for unknown event} => listener stored but not called', async () => {
        const process = EventEmittingProcessStub();
        const listener = jest.fn();

        process.on('unknown-event', listener);

        await new Promise((resolve) => {
          setImmediate(resolve);
        });

        expect(listener).toHaveBeenCalledTimes(0);
      });
    });
  });
});
