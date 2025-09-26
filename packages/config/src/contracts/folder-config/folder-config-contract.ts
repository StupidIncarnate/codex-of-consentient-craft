// The computed structure that lint rules actually check
export type AllowedExternalImports = {
  widgets: string[] | null; // null means folder not allowed in this framework
  bindings: string[] | null; // null means folder not allowed in this framework
  state: string[] | null; // null means folder not allowed in this framework
  flows: string[] | null; // null means folder not allowed in this framework
  responders: string[] | null; // null means folder not allowed in this framework
  contracts: string[]; // Always allowed, contains schema libraries
  brokers: string[]; // Always allowed, usually empty
  transformers: string[]; // Always allowed, usually empty
  errors: string[]; // Always allowed, usually empty
  middleware: string[]; // Always allowed, usually empty
  adapters: string[]; // Always allowed, usually ["*"] (unrestricted)
  startup: string[]; // Always allowed, usually ["*"] (unrestricted)
};

export const VALID_ARCHITECTURE_FOLDERS = [
  'contracts',
  'transformers',
  'errors',
  'flows',
  'adapters',
  'middleware',
  'brokers',
  'bindings',
  'state',
  'responders',
  'widgets',
  'startup',
  'assets',
  'migrations',
] as const;

export type ArchitectureFolder = (typeof VALID_ARCHITECTURE_FOLDERS)[number];

export const isValidArchitectureFolder = (folder: unknown): folder is ArchitectureFolder =>
  typeof folder === 'string' && VALID_ARCHITECTURE_FOLDERS.includes(folder as ArchitectureFolder);
