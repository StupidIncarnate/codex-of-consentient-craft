import type { StubArgument } from '@dungeonmaster/shared/@types';

import { debugCommandContract } from './debug-command-contract';
import type { DebugCommand } from './debug-command-contract';
import { CliAppScreenStub } from '../cli-app-screen/cli-app-screen.stub';
import { KeyNameStub } from '../key-name/key-name.stub';

export const DebugCommandStartStub = ({
  ...props
}: StubArgument<DebugCommand> = {}): DebugCommand =>
  debugCommandContract.parse({
    action: 'start',
    screen: CliAppScreenStub(),
    ...props,
  });

export const DebugCommandInputStub = ({
  ...props
}: StubArgument<DebugCommand> = {}): DebugCommand =>
  debugCommandContract.parse({
    action: 'input',
    text: 'test input',
    ...props,
  });

export const DebugCommandKeypressStub = ({
  ...props
}: StubArgument<DebugCommand> = {}): DebugCommand =>
  debugCommandContract.parse({
    action: 'keypress',
    key: KeyNameStub(),
    ...props,
  });

export const DebugCommandGetScreenStub = ({
  ...props
}: StubArgument<DebugCommand> = {}): DebugCommand =>
  debugCommandContract.parse({
    action: 'getScreen',
    ...props,
  });

export const DebugCommandExitStub = ({ ...props }: StubArgument<DebugCommand> = {}): DebugCommand =>
  debugCommandContract.parse({
    action: 'exit',
    ...props,
  });

export const DebugCommandStub = ({ ...props }: StubArgument<DebugCommand> = {}): DebugCommand =>
  debugCommandContract.parse({
    action: 'start',
    screen: CliAppScreenStub(),
    ...props,
  });
