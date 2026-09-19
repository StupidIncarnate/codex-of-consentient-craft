import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../epoch-ms/epoch-ms.stub';
import { shutdownReasonContract } from './shutdown-reason-contract';
import type { ShutdownReason } from './shutdown-reason-contract';

export const ShutdownReasonStub = ({
  ...props
}: StubArgument<ShutdownReason> = {}): ShutdownReason =>
  shutdownReasonContract.parse({
    reason: ContentTextStub({ value: 'reaped by idle timeout after 900s with no run received' }),
    atMs: EpochMsStub(),
    ...props,
  });
