import type { StubArgument } from '@dungeonmaster/shared/@types';

import { schemaObjectEntryContract } from './schema-object-entry-contract';
import type { SchemaObjectEntry } from './schema-object-entry-contract';

export const SchemaObjectEntryStub = ({
  ...props
}: StubArgument<SchemaObjectEntry> = {}): SchemaObjectEntry =>
  schemaObjectEntryContract.parse({
    key: 'id',
    valueText: "z.string().brand<'ThingId'>()",
    ...props,
  });
