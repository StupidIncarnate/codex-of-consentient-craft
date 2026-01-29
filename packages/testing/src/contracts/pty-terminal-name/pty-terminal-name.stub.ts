import { ptyTerminalNameContract, type PtyTerminalName } from './pty-terminal-name-contract';

export const PtyTerminalNameStub = (
  { value }: { value: string } = { value: 'xterm-256color' },
): PtyTerminalName => ptyTerminalNameContract.parse(value);
