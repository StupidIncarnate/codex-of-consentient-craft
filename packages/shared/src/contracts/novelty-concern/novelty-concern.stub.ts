import type { StubArgument } from '@dungeonmaster/shared/@types';

import { noveltyConcernContract } from './novelty-concern-contract';
import type { NoveltyConcern } from './novelty-concern-contract';

export const NoveltyConcernStub = ({
  ...props
}: StubArgument<NoveltyConcern> = {}): NoveltyConcern =>
  noveltyConcernContract.parse({
    area: 'tech',
    description: 'First time wrapping @mantine/notifications.show in this repo',
    recommendsExploratory: true,
    ...props,
  });
