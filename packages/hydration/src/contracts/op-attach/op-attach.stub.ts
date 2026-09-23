import type { StubArgument } from '@dungeonmaster/shared/@types';
import { opAttachContract } from './op-attach-contract';
import type { OpAttach } from './op-attach-contract';

export const OpAttachStub = ({ ...props }: StubArgument<OpAttach> = {}): OpAttach =>
  opAttachContract.parse({
    op: 'attach',
    ingredient: 'quest',
    ref: 'quest[0:0]',
    ancestors: [],
    where: { id: '00000000-0000-4000-8000-000000000001' },
    ...props,
  });
