import { commandHandlerContract } from './command-handler-contract';
import type { CommandHandler } from './command-handler-contract';

export const CommandHandlerStub = (): CommandHandler =>
  commandHandlerContract.parse((): void => {
    // No-op handler for testing
  });
