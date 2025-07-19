/**
 * Type guard utilities for runtime type checking
 */

/**
 * Type guard to check if a value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if a value is an object with specific properties
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for package.json structure
 */
export interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  eslintConfig?: Record<string, unknown>;
  jest?: Record<string, unknown>;
  [key: string]: unknown;
}

export function isPackageJson(value: unknown): value is PackageJson {
  if (!isObject(value)) {
    return false;
  }

  // Check optional properties have correct types if present
  if ('scripts' in value && value.scripts !== undefined && !isObject(value.scripts)) {
    return false;
  }

  if (
    'dependencies' in value &&
    value.dependencies !== undefined &&
    !isObject(value.dependencies)
  ) {
    return false;
  }

  if (
    'devDependencies' in value &&
    value.devDependencies !== undefined &&
    !isObject(value.devDependencies)
  ) {
    return false;
  }

  return true;
}

/**
 * Parse JSON safely with type validation
 */
export function parseJsonSafely<T>(
  json: string,
  validator: (value: unknown) => value is T,
): T | null {
  try {
    const parsed: unknown = JSON.parse(json);
    return validator(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Type guard for Claude settings structure
 */
export interface ClaudeSettings {
  tools?: {
    Write?: {
      allowed_paths?: string[];
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export function isClaudeSettings(value: unknown): value is ClaudeSettings {
  if (!isObject(value)) {
    return false;
  }

  if ('tools' in value && value.tools !== undefined && !isObject(value.tools)) {
    return false;
  }

  return true;
}

/**
 * Type guard for ESLint configuration structure (for internal use)
 * Note: This is for configs we generate internally, not user-provided data
 */
export interface EslintConfig {
  extends?: string[];
  env?: Record<string, boolean>;
  parserOptions?: Record<string, unknown>;
  rules?: Record<string, unknown>;
  [key: string]: unknown;
}

export function isEslintConfig(value: unknown): value is EslintConfig {
  if (!isObject(value)) {
    return false;
  }

  if ('extends' in value && value.extends !== undefined && !Array.isArray(value.extends)) {
    return false;
  }

  if ('env' in value && value.env !== undefined && !isObject(value.env)) {
    return false;
  }

  if ('rules' in value && value.rules !== undefined && !isObject(value.rules)) {
    return false;
  }

  return true;
}
