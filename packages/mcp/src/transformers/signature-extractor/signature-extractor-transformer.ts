/**
 * PURPOSE: Extracts TypeScript function signature from export statement
 *
 * USAGE:
 * const signature = signatureExtractorTransformer({
 *   fileContents: FileContentsStub({ value: 'export const foo = ({ x }: { x: number }): string => {}' })
 * });
 * // Returns: { raw: '...', parameters: [...], returnType: 'string' }
 */
import { signatureRawContract } from '../../contracts/signature-raw/signature-raw-contract';
import { parameterNameContract } from '../../contracts/parameter-name/parameter-name-contract';
import { returnTypeContract } from '../../contracts/return-type/return-type-contract';
import { typeNameContract } from '../../contracts/type-name/type-name-contract';
import type { FileContents } from '../../contracts/file-contents/file-contents-contract';
import type { FunctionSignature } from '../../contracts/file-metadata/file-metadata-contract';
import type { TypeName } from '../../contracts/type-name/type-name-contract';
import type { FunctionName } from '../../contracts/function-name/function-name-contract';
import { kebabToCamelTransformer } from '../kebab-to-camel/kebab-to-camel-transformer';

export const signatureExtractorTransformer = ({
  fileContents,
  functionName,
}: {
  fileContents: FileContents;
  functionName?: FunctionName;
}): FunctionSignature | null => {
  // Match export const functionName = ({ params }: { types }): ReturnType =>
  const signaturePattern =
    /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(\s*\{([^}]*)\}\s*:\s*\{([^}]*)\}\s*\)\s*:\s*([^=]+?)(?:\s*=>)/u;
  const match = signaturePattern.exec(fileContents);

  if (!match) {
    return null;
  }

  const extractedName = match[1] ?? '';
  const typesStr = match[3] ?? '';
  const returnTypeStr = match[4]?.trim() ?? '';

  // If functionName provided, verify it matches (convert kebab-case to camelCase for comparison)
  if (functionName) {
    const camelCaseName = kebabToCamelTransformer({ kebabCase: functionName });
    if (extractedName !== String(camelCaseName)) {
      return null;
    }
  }

  // Parse parameter types
  const typeEntries = typesStr
    .split(';')
    .map((t) => t.trim())
    .filter(Boolean);

  const paramTypesObj: Record<TypeName, TypeName> = {} as Record<TypeName, TypeName>;
  for (const entry of typeEntries) {
    const [name, type] = entry.split(':').map((s) => s.trim());
    if (name && type) {
      paramTypesObj[typeNameContract.parse(name)] = typeNameContract.parse(type);
    }
  }

  const raw = signatureRawContract.parse(match[0]);
  const parameterName = parameterNameContract.parse('destructured object');
  const returnType = returnTypeContract.parse(returnTypeStr);

  return {
    raw,
    parameters: [
      {
        name: parameterName,
        type: paramTypesObj,
      },
    ],
    returnType,
  };
};
