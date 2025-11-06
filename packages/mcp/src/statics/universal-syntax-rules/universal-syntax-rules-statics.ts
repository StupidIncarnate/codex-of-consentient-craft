/**
 * PURPOSE: Defines all universal syntax rules that apply to ALL code regardless of folder type
 *
 * USAGE:
 * import { universalSyntaxRulesStatics } from './statics/universal-syntax-rules/universal-syntax-rules-statics';
 * const fileNamingRule = universalSyntaxRulesStatics.fileNaming.rule;
 * // Returns 'All filenames must use kebab-case'
 *
 * WHEN-TO-USE: When implementing or testing universal code standards that apply across all files
 */
export const universalSyntaxRulesStatics = {
  fileNaming: {
    rule: 'All filenames must use kebab-case',
    patternDescription: 'Lowercase letters, numbers, and hyphens only, with valid file extensions',
    examples: ['user-fetch-broker.ts', 'format-date-transformer.ts', 'user-contract.ts'],
    violations: ['userFetchBroker.ts', 'format_date_transformer.ts', 'UserContract.ts'],
  },

  functionExports: {
    rule: 'All functions must use export const with arrow function syntax',
    exceptions: ['Error classes use export class'],
    examples: [
      'export const userFetchBroker = async ({userId}: {userId: UserId}): Promise<User> => { /* implementation */ };',
      'export class ValidationError extends Error { /* implementation */ }',
    ],
    violations: [
      'export function userFetchBroker(userId: UserId): Promise<User> { /* implementation */ }',
      'export default function userFetchBroker(userId: UserId): Promise<User> { /* implementation */ }',
    ],
  },

  namedExports: {
    rule: 'Always use named exports, never default exports',
    exceptions: ['Index files connecting to systems that require default exports'],
    examples: ['export const userFetchBroker = ...', 'export type User = { ... }'],
    violations: [
      'export default function userFetchBroker() { ... }',
      'export default class User { ... }',
    ],
  },

  singleResponsibility: {
    rule: 'Each file must contain and export exactly one primary piece of functionality',
    allowedCoExports: ['Supporting types and interfaces directly related to that functionality'],
    examples: [
      'export type UserFetchParams = { userId: UserId; }; export const userFetchBroker = async ({userId}: UserFetchParams): Promise<User> => { /* implementation */ };',
    ],
    violations: [
      'export const userFetchBroker = async ({userId}: {userId: UserId}): Promise<User> => {}; export const userCreateBroker = async ({data}: {data: UserData}): Promise<User> => {}; export const userDeleteBroker = async ({userId}: {userId: UserId}): Promise<void> => {};',
    ],
  },

  fileMetadata: {
    rule: 'Every implementation file must have structured metadata comments at the very top (before imports)',
    requiredFormat:
      '/** * PURPOSE: [One-line description] * * USAGE: * [Code example] * // [Comment explaining what it returns] */',
    requiredFor: [
      'All implementation files (-adapter.ts, -broker.ts, -guard.ts, -transformer.ts, -contract.ts, -statics.ts, etc.)',
    ],
    notRequiredFor: ['Test files (.test.ts)', 'Proxy files (.proxy.ts)', 'Stub files (.stub.ts)'],
    optionalFields: ['WHEN-TO-USE', 'WHEN-NOT-TO-USE'],
    examples: [
      '/** * PURPOSE: Validates if a user has permission to perform an action * * USAGE: * hasPermissionGuard({user, permission: "admin:delete"}); * // Returns true if user has permission, false otherwise * * WHEN-TO-USE: Before executing privileged operations * WHEN-NOT-TO-USE: For public endpoints that don\'t require authorization */',
    ],
  },

  functionParameters: {
    rule: 'All app code functions must use object destructuring with inline types',
    exceptions: ['Only when integrating with external APIs that require specific signatures'],
    examples: [
      'export const updateUser = ({user, companyId}: {user: User; companyId: CompanyId}): Promise<User> => { /* implementation */ };',
      'export const processOrder = ({user, companyId}: {user: User; companyId: CompanyId}): Promise<Order> => { /* Type safety maintained - companyId is CompanyId branded type, not raw string */ };',
    ],
    violations: [
      'export const updateUser = (user: User, companyId: string) => { /* implementation */ };',
      'export const processOrder = ({userName, userEmail, companyId}: {userName: string; userEmail: string; companyId: string;}): Promise<Order> => { /* Use UserName, EmailAddress, CompanyId contracts */ };',
    ],
    passCompleteObjects:
      'Pass complete objects to preserve type relationships using contracts, not individual properties',
    extractIdPattern: "When you need just an ID, extract it with Type['id'] notation",
  },

  importRules: {
    rule: 'All imports at top of file - No inline imports, requires, or dynamic imports',
    preferEs6: 'Use ES6 imports - Prefer import over require()',
    grouping: 'Group imports logically - External packages, then internal modules, then types',
    examples: [
      'import {readFile} from "fs/promises"; import axios from "axios"; import {userFetchBroker} from "../../brokers/user/fetch/user-fetch-broker"; import {formatDateTransformer} from "../../transformers/format-date/format-date-transformer"; import type {User} from "../../contracts/user/user-contract"; import type {DateString} from "../../contracts/date-string/date-string-contract";',
    ],
    violations: [
      'const loadUser = async () => { const {userFetchBroker} = await import("../../brokers/user/fetch/user-fetch-broker"); };',
    ],
  },

  typeExports: {
    rule: 'Type export syntax varies by file type',
    regularFiles: 'Only define types with export type Name = { ... }',
    indexFiles: 'Only re-export with export type { Name } from "./types"',
    forbidden: 'Never use export { type Name } (forbidden inline syntax)',
    examples: [
      'export type User = { id: UserId; name: UserName; }; // Regular file',
      'export type {User} from "./user-contract"; // index.ts re-export',
    ],
    violations: ['export {type User} from "./user-contract"; // Forbidden inline syntax'],
  },

  typeSafety: {
    strictTyping: {
      rule: 'Strict typing required - No type suppression allowed',
      noTypeSuppression: 'Never use @ts-ignore or @ts-expect-error',
      useContracts:
        'Use Zod contracts instead of primitives - All string/number parameters must use branded Zod types',
      explicitReturnTypes:
        'All exported functions must have explicit return types using Zod contracts',
      useExistingTypes: 'Use existing types from codebase or create new ones',
    },
    uncertainData: {
      rule: 'For uncertain data (external inputs, API responses, catch variables, JSON.parse): Use unknown and validate through contracts',
      examples: [
        'export const handleError = ({error}: {error: unknown}): ErrorMessage => { if (error instanceof Error) { return errorMessageContract.parse(error.message); } if (typeof error === "string") { return errorMessageContract.parse(error); } return errorMessageContract.parse("Unknown error"); };',
      ],
    },
    fixAtSource: {
      rule: 'Never suppress errors - fix at source',
      violations: [
        '// @ts-ignore const result = dangerousOperation();',
        '// @ts-expect-error const value = user.nonExistentProperty;',
      ],
      correctApproach:
        'Create proper Zod contracts instead: export const apiResponseContract = z.object({data: z.array(userContract), meta: z.object({total: z.number().int().brand<"TotalCount">()})}); export type ApiResponse = z.infer<typeof apiResponseContract>;',
    },
    typeInference: {
      rule: 'Let TypeScript infer when values are clear, be explicit for: empty arrays/objects, ambiguous values, ALL exported functions',
      examples: [
        'const users: User[] = []; // Explicit for empty',
        'const config: Record<UserId, User> = {}; // Explicit for empty',
        'const userId = user.id; // Inferred from user type (already branded)',
        'const names = users.map(u => u.name); // Inferred from array (already branded)',
      ],
      violations: ['const data: any = response.data; // Loses all type safety'],
    },
    typeAssertions: {
      satisfies: {
        rule: 'Use satisfies to validate object structure while preserving inference',
        examples: [
          'const config = { apiUrl: "http://localhost", port: 3000, } satisfies Partial<Config>; // Validates structure, keeps literal types',
        ],
      },
      as: {
        rule: 'Use as only when you have information compiler lacks (JSON.parse, external data)',
        examples: ['const data = JSON.parse(response) as ApiResponse;'],
        violations: ['const broken = {} as ComplexType; // Hides missing properties'],
      },
      neverBypassErrors: 'Never use as to bypass type errors - fix the type instead',
    },
    functionSignatures: {
      rule: 'ban-primitives rule: Inputs allow primitives, returns require branded types',
      inputsAllowPrimitives: 'Input args can use raw primitives (inline object types)',
      returnsMustUseBranded: 'Return types must use branded types/contracts',
      examples: [
        'export type SomeService = { doSomething: (params: {name: string; count: number}) => Result; getUser: () => User; getConfig: () => {apiKey: ApiKey; timeout: Milliseconds}; };',
        'export const loadConfig = (): Config => { return configContract.parse({apiUrl: process.env.API_URL || "http://localhost:3000", timeout: parseInt(process.env.TIMEOUT || "5000")}); };',
      ],
      violations: [
        'export const badFunction = ({userId, name}: {userId: string; name: string}) => { /* Use UserId and UserName contracts instead */ };',
      ],
    },
    noRawPrimitives: {
      rule: 'Never use raw primitives in function signatures - always use branded types from contracts',
      violations: [
        'export const badFunction = ({userId, name}: {userId: string; name: string}) => { /* Use UserId and UserName contracts instead */ };',
      ],
      examples: [
        'export const goodFunction = ({userId, name}: {userId: UserId; name: UserName}): Result => { /* implementation */ };',
      ],
    },
  },

  promiseHandling: {
    rule: 'Always use async/await over .then() chains for readability',
    handleErrorsAppropriately:
      'Not every async call needs try/catch - handle errors at appropriate level',
    parallelOperations: 'Use Promise.all() for parallel operations when independent',
    sequentialOperations: 'Await sequentially only when operations are dependent',
    examples: [
      'const [user, config, permissions] = await Promise.all([fetchUser({id: userId}), loadConfig(), getPermissions({id: userId})]); // Parallel when independent',
      'const user = await fetchUser({id: userId}); const company = await fetchCompany({companyId: user.companyId}); // Sequential when dependent',
    ],
    violations: [
      'const user = await fetchUser({id: userId}); const config = await loadConfig(); const permissions = await getPermissions({id: userId}); // Should be parallel',
    ],
  },

  loopControl: {
    rule: 'Use recursion for indeterminate loops - Never use while (true) or loops with unchanging conditions',
    recursion:
      'Recursion with early returns for tree traversal, file system walking, config resolution',
    regularLoopsOk:
      'for loops over arrays, .forEach(), .map(), .filter(), loops with clear termination conditions are fine',
    examples: [
      'const findConfig = async ({path}: {path: string}): Promise<string> => { try { const config = await loadConfig({path}); return config; } catch { const parent = getParent({path}); return await findConfig({path: parent}); // Recurse with early return } };',
    ],
    violations: [
      'while (true) { const config = await loadConfig({path}); // Lint: await in loop, unnecessary condition if (config) break; path = getParent({path}); }',
    ],
  },

  errorHandling: {
    rule: 'Handle errors explicitly for every operation that can fail',
    neverSilentlySwallow:
      'Never silently swallow errors - Always log, throw, or handle appropriately',
    provideContext: 'Provide context in error messages with relevant data',
    examples: [
      'export const loadConfig = async ({path}: {path: AbsoluteFilePath}): Promise<Config> => { try { const content = await readFile(path, "utf8"); return configContract.parse(JSON.parse(content)); } catch (error) { throw new Error("Failed to load config from " + path + ": " + error); } };',
      'export const processUser = async ({userId}: {userId: UserId}): Promise<User> => { const user = await userFetchBroker({userId}); // Let broker throw, catch at responder level return user; };',
    ],
    violations: [
      'const loadConfig = async ({path}: {path: string}) => { try { return JSON.parse(await readFile(path, "utf8")); } catch (error) { return {}; // Silent failure loses critical information! } };',
      'throw new Error("Config load failed"); // What path? What error?',
    ],
  },

  performance: {
    efficientAlgorithms: {
      rule: 'Default to efficient algorithms - Dataset sizes are unknown, use Map/Set for lookups over nested array searches',
      examples: [
        'const userMap = new Map(users.map(user => [user.id, user])); const targetUser = userMap.get(targetId); // O(n)',
      ],
      violations: [
        'const activeUsers = users.filter(user => { return otherUsers.find(other => other.id === user.id)?.isActive; }); // O(n²) nested loops',
      ],
    },
    removeDeadCode: {
      rule: 'Delete unused variables/parameters, unreachable code, orphaned files, commented-out code, console.log statements',
    },
    useReflectMethods: {
      deleteProperty: {
        rule: 'Use Reflect.deleteProperty() - Never use delete obj[key] with computed keys',
        examples: ['Reflect.deleteProperty(require.cache, resolvedPath);'],
        violations: ['delete require.cache[resolvedPath]; // Lint error'],
      },
      get: {
        rule: 'Use Reflect.get() for accessing properties on objects when TypeScript narrows to object type',
        rationale: 'Avoids unsafe type assertions from object to Record<PropertyKey, unknown>',
        examples: [
          'export const hasStringProperty = (params: {obj: unknown; property: string;}): params is {obj: Record<PropertyKey, string>; property: string} => { const {obj, property} = params; if (typeof obj !== "object" || obj === null) { return false; } return property in obj && typeof Reflect.get(obj, property) === "string"; };',
        ],
        violations: [
          'const record = obj as Record<string, unknown>; // Lint error: unsafe type assertion return typeof record[property] === "string";',
        ],
      },
    },
  },

  cliOutput: {
    rule: 'Use process.stdout/stderr - Never use console.log() or console.error() in CLI implementations',
    standardOutput: 'process.stdout.write() for normal output',
    errorOutput: 'process.stderr.write() for errors',
    includeNewlines: 'Append \\n explicitly to output strings',
    examples: [
      'process.stdout.write("Processing " + count + " files...\\n");',
      'process.stderr.write("Error: " + errorMessage + "\\n");',
    ],
    violations: [
      'console.log("Processing " + count + " files...");',
      'console.error("Error: " + errorMessage);',
    ],
  },

  testing: {
    antiPatterns: {
      assertions: {
        propertyBleedthrough:
          'Using partial matchers (toMatchObject, toContain) that allow extra properties to leak through',
        existenceOnlyChecks: 'Using toBeDefined() instead of testing actual values',
        countOnlyChecks: 'Testing array.length without verifying complete content',
        weakMatchers:
          'Using .toEqual(), .toMatchObject(), .toContain(), .toBeTruthy()/.toBeFalsy()',
        violations: [
          'expect(result).toMatchObject({id: "123"}); // Extra properties pass!',
          'expect(userId).toBeDefined(); // Could be any value!',
          'expect(items).toHaveLength(2); // Could be wrong items!',
          'expect(config.includes("parser")).toBe(true); // Could be anywhere',
        ],
        correctApproach:
          'Use .toStrictEqual() for all objects/arrays to catch property bleedthrough',
      },
      mockingAndProxies: {
        directMockManipulation: 'Using jest.mocked() in tests instead of proxy semantic methods',
        mockingApplicationCode:
          'Using jest.mock() on application code (only mock npm packages in proxies)',
        manualMockCleanup: 'Calling mockReset(), mockClear() (@questmaestro/testing handles this)',
        jestSpyOnModules: 'Using jest.spyOn() for module imports (only use for global objects)',
        sharedProxyInstances:
          'Creating proxy once outside tests (always create fresh proxy per test)',
        violations: [
          'const mockAxios = jest.mocked(axios.get); mockAxios.mockResolvedValue({data: user}); // Use proxy methods',
          'jest.mock("../../brokers/user/fetch/user-fetch-broker"); // Never mock app code',
          'beforeEach(() => { jest.clearAllMocks(); }); // @questmaestro/testing handles this',
          'jest.spyOn(adapter, "fsReadFile"); // Use jest.mock for modules',
          'const proxy = userFetchBrokerProxy(); it("test 1", () => {}); it("test 2", () => {}); // Stale mocks',
        ],
        correctApproach:
          'Create fresh proxy per test, use semantic methods, only mock npm packages in proxies',
      },
      typeSafety: {
        typeEscapeHatches: 'Using any, as, @ts-ignore in tests to bypass type errors',
        violations: [
          'const data: any = response.data; // Loses all type safety',
          'const user = {} as User; // Hides missing properties',
          '// @ts-ignore - Testing invalid input',
        ],
        correctApproach:
          'Use ReturnType<typeof Stub> for types, use stubs to create valid instances, use "as never" for testing invalid inputs',
      },
      testOrganization: {
        testingImplementation: 'Spying on internal methods instead of testing outputs',
        sharedTestState: 'Tests depending on each other or shared setup',
        unitTestingDslLogic:
          'Mocking systems that interpret DSL/queries (ESLint selectors, SQL, GraphQL)',
        commentOrganization: 'Using comments instead of describe blocks for test structure',
        violations: [
          'jest.spyOn(myClass, "_internalMethod"); // Test behavior, not implementation',
          'let sharedUser; beforeEach(() => { sharedUser = UserStub(); }); // No hooks',
          'const mockContext = {report: jest.fn()}; rule.create(mockContext); // ESLint needs real parsing',
          '// valid cases it("test 1"); it("test 2"); // Use describe blocks',
        ],
        correctApproach:
          'Test outputs not internals, inline setup/teardown, integration tests for DSL logic, describe blocks for organization',
      },
    },
  },

  summaryChecklist: {
    items: [
      'File uses kebab-case naming',
      'Function uses export const with arrow syntax',
      'File has PURPOSE/USAGE metadata comment at top',
      'Function parameters use object destructuring',
      'All imports are at the top of the file',
      'Exported function has explicit return type using contracts',
      'No any, @ts-ignore, or type suppressions',
      'All string/number types are branded through Zod contracts',
      'Error handling provides context',
      'No console.log in production code',
      'No while (true) loops (use recursion)',
      'Efficient algorithms (Map/Set for lookups)',
      'No dead code or commented-out code',
    ],
  },
} as const;
