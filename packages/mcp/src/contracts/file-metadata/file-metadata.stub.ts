import { fileMetadataContract } from './file-metadata-contract';
import type { FileMetadata } from './file-metadata-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const FileMetadataStub = ({ ...props }: StubArgument<FileMetadata> = {}): FileMetadata =>
  fileMetadataContract.parse({
    name: 'userFetchBroker',
    path: '/test/brokers/user/fetch/user-fetch-broker.ts',
    fileType: 'broker',
    purpose: 'Fetches user data from the API by user ID',
    signature: {
      raw: '({ userId }: { userId: UserId }): Promise<User>',
      parameters: [
        {
          name: 'destructured object',
          type: { userId: 'UserId' },
        },
      ],
      returnType: 'Promise<User>',
    },
    usage:
      "const user = await userFetchBroker({ userId: UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479') });",
    relatedFiles: [],
    source: 'project',
    ...props,
  });
