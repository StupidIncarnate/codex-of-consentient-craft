import { fileMetadataCommentContract } from './file-metadata-comment-contract';
import type { FileMetadataComment } from './file-metadata-comment-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const FileMetadataCommentStub = ({
  ...props
}: StubArgument<FileMetadataComment> = {}): FileMetadataComment =>
  fileMetadataCommentContract.parse({
    purpose: 'Test purpose description',
    usage: 'testFunction({ param: value })',
    ...props,
  });
