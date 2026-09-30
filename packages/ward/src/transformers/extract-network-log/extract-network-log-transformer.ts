/**
 * PURPOSE: Extracts network log content from between __NETWORK_LOG__ delimiters in raw test output
 *
 * USAGE:
 * extractNetworkLogTransformer({ rawOutput: errorMessageContract.parse('before\n__NETWORK_LOG__\nGET /api 200\n__NETWORK_LOG_END__\nafter') });
 * // Returns 'GET /api 200' as ErrorMessage
 */

const NETWORK_LOG_START = '__NETWORK_LOG__';
const NETWORK_LOG_END = '__NETWORK_LOG_END__';

export const extractNetworkLogTransformer = ({ rawOutput }: { rawOutput: string }): string => {
  const blocks: string[] = [];
  let searchFrom = 0;

  while (searchFrom < rawOutput.length) {
    const startIndex = rawOutput.indexOf(NETWORK_LOG_START, searchFrom);

    if (startIndex === -1) {
      break;
    }

    const contentStart = startIndex + NETWORK_LOG_START.length;
    const endIndex = rawOutput.indexOf(NETWORK_LOG_END, contentStart);

    if (endIndex === -1) {
      break;
    }

    const content = rawOutput.slice(contentStart, endIndex).trim();

    if (content.length > 0) {
      blocks.push(content);
    }

    searchFrom = endIndex + NETWORK_LOG_END.length;
  }

  return blocks.join('\n');
};
