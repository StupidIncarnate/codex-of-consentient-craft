import { eventEmittingProcessContract } from './event-emitting-process-contract';
import type { EventEmittingProcess } from './event-emitting-process-contract';

interface StubArgument {
  kill?: EventEmittingProcess['kill'];
  on?: EventEmittingProcess['on'];
  exitCode?: number;
  error?: Error;
}

export const EventEmittingProcessStub = ({ ...props }: StubArgument = {}): EventEmittingProcess => {
  const { kill, on, exitCode = 0, error } = props;

  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();

  const defaultOn = (event: string, listener: (...args: unknown[]) => void): unknown => {
    const eventListeners = listeners.get(event) ?? [];
    eventListeners.push(listener);
    listeners.set(event, eventListeners);

    // Emit error event asynchronously if error was provided
    if (event === 'error' && error) {
      setImmediate(() => {
        listener(error);
      });
    }

    // Emit exit event asynchronously if no error was provided
    if (event === 'exit' && !error) {
      setImmediate(() => {
        listener(exitCode);
      });
    }

    return undefined;
  };

  const result = eventEmittingProcessContract.parse({
    kill: kill ?? (() => true),
    on: on ?? defaultOn,
  });

  return result;
};
