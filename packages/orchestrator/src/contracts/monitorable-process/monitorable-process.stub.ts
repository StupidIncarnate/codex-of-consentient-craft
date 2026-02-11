import { monitorableProcessContract } from './monitorable-process-contract';
import type { MonitorableProcess } from './monitorable-process-contract';

export const MonitorableProcessStub = (): MonitorableProcess => {
  // Validate structure through contract (functions checked for presence)
  monitorableProcessContract.parse({
    kill: () => true,
    on: () => undefined,
  });

  // Return typed object with proper function signatures
  return {
    kill: () => true,
    on: (_event: 'exit', _listener: (code: number | null) => void): void => undefined,
  };
};
