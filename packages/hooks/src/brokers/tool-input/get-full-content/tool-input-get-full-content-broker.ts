/**
 * PURPOSE: Computes full file content after applying Write, Edit, or MultiEdit operations
 *
 * USAGE:
 * const newContent = await toolInputGetFullContentBroker({ toolInput: editToolInput });
 * // Returns full file content string after applying edits, or null if not applicable
 */
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import type { ToolInput } from '../../../contracts/tool-input/tool-input-contract';
import { regexEscapeTransformer } from '../../../transformers/regex-escape/regex-escape-transformer';
import { isNodeErrorContract } from '../../../contracts/is-node-error/is-node-error-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';

interface Edit {
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}

// Type guard for Record<string, unknown>
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const applyEdit = ({
  content,
  oldString,
  newString,
  replaceAll,
}: {
  content: string;
  oldString: string;
  newString: string;
  replaceAll?: boolean;
}): string => {
  if (replaceAll === true) {
    const regex = new RegExp(regexEscapeTransformer({ str: oldString }), 'gu');
    return content.replace(regex, newString);
  }
  return content.replace(oldString, newString);
};

const applyMultipleEdits = ({ content, edits }: { content: string; edits: Edit[] }): string => {
  let result = content;

  for (const edit of edits) {
    const editParams: {
      content: string;
      oldString: string;
      newString: string;
      replaceAll?: boolean;
    } = {
      content: result,
      oldString: edit.old_string,
      newString: edit.new_string,
    };

    if (edit.replace_all === true) {
      editParams.replaceAll = true;
    }

    result = applyEdit(editParams);
  }

  return result;
};

const readFileContent = async (filePath: string): Promise<string | null> => {
  try {
    return await fsReadFileAdapter({ filePath: filePathContract.parse(filePath) });
  } catch (error: unknown) {
    const isNodeError = isNodeErrorContract({ error });
    if (isNodeError) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        return null;
      }
    }
    throw error;
  }
};

const applySingleEdit = ({
  content,
  toolInput,
}: {
  content: string;
  toolInput: ToolInput;
}): string => {
  if (!('new_string' in toolInput && 'old_string' in toolInput)) {
    throw new Error('Invalid edit input');
  }

  const editParams: {
    content: string;
    oldString: string;
    newString: string;
    replaceAll?: boolean;
  } = {
    content,
    oldString: toolInput.old_string,
    newString: toolInput.new_string,
  };

  if (toolInput.replace_all === true) {
    editParams.replaceAll = true;
  }

  return applyEdit(editParams);
};

const applyMultiEdits = ({
  content,
  toolInput,
}: {
  content: string;
  toolInput: ToolInput;
}): string => {
  if (!('edits' in toolInput && Array.isArray(toolInput.edits))) {
    throw new Error('Invalid multi-edit input');
  }

  const editsArray: Edit[] = toolInput.edits.map((editItem: unknown): Edit => {
    if (!isRecord(editItem)) {
      throw new Error('Invalid edit format: expected object');
    }

    const oldString = editItem.old_string;
    const newString = editItem.new_string;
    const replaceAll = editItem.replace_all;

    const result: Edit = {
      old_string: typeof oldString === 'string' ? oldString : String(oldString),
      new_string: typeof newString === 'string' ? newString : String(newString),
    };

    if (replaceAll === true) {
      result.replace_all = true;
    }

    return result;
  });

  return applyMultipleEdits({ content, edits: editsArray });
};

export const toolInputGetFullContentBroker = async ({
  toolInput,
}: {
  toolInput: ToolInput;
}): Promise<string | null> => {
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (filePath === '') {
    return null;
  }

  // For Write tool, we already have the full content
  if ('content' in toolInput) {
    return toolInput.content;
  }

  const existingContent = await readFileContent(filePath);

  if (existingContent === null) {
    return null;
  }

  // For Edit tool, apply the single edit
  if ('new_string' in toolInput && 'old_string' in toolInput && !('edits' in toolInput)) {
    return applySingleEdit({ content: existingContent, toolInput });
  }

  // For MultiEdit tool, apply all edits sequentially
  if ('edits' in toolInput && Array.isArray(toolInput.edits)) {
    return applyMultiEdits({ content: existingContent, toolInput });
  }

  return null;
};
