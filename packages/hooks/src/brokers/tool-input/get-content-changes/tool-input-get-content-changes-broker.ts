/**
 * PURPOSE: Extracts content changes (old vs new) from Write, Edit, or MultiEdit tool inputs
 *
 * USAGE:
 * const changes = await toolInputGetContentChangesBroker({ toolInput: writeToolInput });
 * // Returns array of ContentChange with oldContent and newContent
 */
import { fsReadFile } from '../../../adapters/fs/fs-read-file';
import type { ToolInput } from '../../../contracts/tool-input/tool-input-contract';
import { toolInputGetFullContentBroker } from '../get-full-content/tool-input-get-full-content-broker';
import { isNodeError } from '../../../contracts/is-node-error/is-node-error';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';

export interface ContentChange {
  oldContent: string;
  newContent: string;
}

const readOldContent = async (filePath: string): Promise<string> => {
  try {
    return await fsReadFile({ filePath: filePathContract.parse(filePath) });
  } catch (error) {
    // File doesn't exist - new file case
    if (isNodeError(error) && error.code !== 'ENOENT') {
      throw error;
    }
    return '';
  }
};

const handleWriteToolInput = async ({
  toolInput,
  filePath,
}: {
  toolInput: ToolInput;
  filePath: string;
}): Promise<ContentChange | null> => {
  if (!('content' in toolInput)) {
    return null;
  }

  const oldContent = await readOldContent(filePath);
  return { oldContent, newContent: toolInput.content };
};

const handleEditToolInput = async ({
  toolInput,
  filePath,
}: {
  toolInput: ToolInput;
  filePath: string;
}): Promise<ContentChange | null> => {
  const isEditTool =
    'new_string' in toolInput && 'old_string' in toolInput && !('edits' in toolInput);

  if (!isEditTool) {
    return null;
  }

  const oldContent = await readOldContent(filePath);
  const newContent = await toolInputGetFullContentBroker({ toolInput });

  if (newContent === null) {
    return null;
  }

  return { oldContent, newContent };
};

const handleMultiEditToolInput = async ({
  toolInput,
  filePath,
}: {
  toolInput: ToolInput;
  filePath: string;
}): Promise<ContentChange | null> => {
  if (!('edits' in toolInput)) {
    return null;
  }

  const oldContent = await readOldContent(filePath);
  const newContent = await toolInputGetFullContentBroker({ toolInput });

  if (newContent === null) {
    return null;
  }

  return { oldContent, newContent };
};

export const toolInputGetContentChangesBroker = async ({
  toolInput,
}: {
  toolInput: ToolInput;
}): Promise<ContentChange[]> => {
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (filePath === '') {
    return [];
  }

  // Try each handler in order
  const writeChange = await handleWriteToolInput({ toolInput, filePath });
  if (writeChange !== null) {
    return [writeChange];
  }

  const editChange = await handleEditToolInput({ toolInput, filePath });
  if (editChange !== null) {
    return [editChange];
  }

  const multiEditChange = await handleMultiEditToolInput({ toolInput, filePath });
  if (multiEditChange !== null) {
    return [multiEditChange];
  }

  return [];
};
