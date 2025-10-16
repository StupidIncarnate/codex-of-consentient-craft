import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { filePathContract } from '@questmaestro/shared/contracts';

interface NodeWithBody {
  body?: Tsestree | null;
}

interface NodeWithDeclarations {
  declarations?: Tsestree[];
}

interface NodeWithId {
  id?: Tsestree | null;
}

interface NodeWithName {
  name?: string;
}

interface NodeWithInit {
  init?: Tsestree | null;
}

interface NodeWithCallee {
  callee?: Tsestree;
}

interface NodeWithObject {
  object?: Tsestree;
}

interface NodeWithProperty {
  property?: Tsestree;
}

interface NodeWithArguments {
  arguments?: Tsestree[];
}

interface NodeWithReturnType {
  returnType?: Tsestree | null;
}

interface NodeWithTypeAnnotation {
  typeAnnotation?: Tsestree | null;
}

interface NodeWithProperties {
  properties?: Tsestree[];
}

interface NodeWithKey {
  key?: Tsestree;
}

export const enforceProxyPatternsRuleBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce proxy file internal patterns for .proxy.ts files',
      },
      messages: {
        proxyMustReturnObject:
          'Proxy function must return an object, not void, primitive, or array. Expected: export const fooProxy = () => ({ method: () => {} })',
        proxyNoBootstrapMethod:
          'Proxy returned object must NOT have a "bootstrap" property/method. Use constructor setup instead.',
        jestMockMustBeModuleLevel:
          'jest.mock() calls must be at module level (outside functions). Move jest.mock() call to top of file.',
        jestMockedOnlyNpmPackages:
          'jest.mocked({{name}}) - Only mock npm packages (axios, fs, etc), not implementation code. Implementation code ending with -adapter, -broker, -transformer, etc. should never be mocked.',
        adapterProxyMustSetupMocks:
          'Adapter proxy must call mock.mockImplementation() or mock.mockResolvedValue() in constructor (before return statement). This sets up default mock behavior when proxy is created.',
        childProxyMustBeInConstructor:
          'Child proxy {{proxyName}} must be created in constructor (before return statement), not inside returned methods. Create it before the return statement.',
        childProxyMustBeInsideFunction:
          'Child proxy {{proxyName}} must be created inside the proxy function, not at module level. Move it inside the create*Proxy function body.',
        proxyNoContractImports:
          'Proxies must not import from contract files ({{importPath}}). Import from stub files (.stub.ts) instead.',
        proxyHelperNoMockInName:
          'Proxy helper "{{name}}" uses forbidden word "{{forbiddenWord}}". Use "returns", "throws", or describe the action instead. Proxies abstract implementation details.',
        proxyConstructorNoSideEffects:
          'Proxy constructor must only create child proxies and setup mocks. Found side effect: {{type}}. Move to setup methods instead. Allowed: const childProxy = create...(), jest.mocked(...), jest.spyOn(...)',
        proxyNotColocated:
          'Proxy file must be colocated with its implementation file. Expected implementation file "{{expectedPath}}" not found in the same directory.',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const { filename } = ctx;

    // Only check .proxy.ts files
    if (!filename || !filename.endsWith('.proxy.ts')) {
      return {};
    }

    // Track child proxy creations for validation
    const childProxyCreations: {
      node: Tsestree;
      name: string;
      isInsideProxyFunction: boolean;
      isBeforeReturn: boolean;
    }[] = [];

    let currentProxyFunction: Tsestree | null = null;
    let foundReturnStatement = false;

    return {
      // Check proxy file colocation at Program level
      Program: (node: Tsestree): void => {
        // Check that proxy file is colocated with implementation file
        const proxyFilePath = filePathContract.parse(filename);

        // Extract implementation file path by removing .proxy.ts and adding .ts
        // Example: foo-adapter.proxy.ts -> foo-adapter.ts
        const implementationPath = filePathContract.parse(
          proxyFilePath.replace(/\.proxy\.ts$/, '.ts'),
        );

        // Check if implementation file exists
        if (!fsExistsSyncAdapter({ filePath: implementationPath })) {
          ctx.report({
            node,
            messageId: 'proxyNotColocated',
            data: {
              expectedPath: implementationPath,
            },
          });
        }
      },

      // Check for contract imports (must use .stub.ts, not -contract.ts)
      ImportDeclaration: (node: Tsestree): void => {
        const importNode = node as unknown as {
          source?: { value?: unknown };
          importKind?: string;
        };
        const { source } = importNode;
        if (!source || typeof source.value !== 'string') return;

        const importPath = source.value;

        // Allow type-only imports (import type { ... })
        if (importNode.importKind === 'type') {
          return;
        }

        // Check if importing from a contract file
        // Contract files end with -contract (no extension in imports)
        if (importPath.endsWith('-contract')) {
          // Allow if it's a stub file
          if (importPath.endsWith('.stub')) {
            return;
          }

          ctx.report({
            node,
            messageId: 'proxyNoContractImports',
            data: { importPath },
          });
        }
      },

      // Check for jest.mock() calls inside functions, jest.mocked() arguments, and child proxy creation
      CallExpression: (node: Tsestree): void => {
        // Use structural interfaces to avoid type assertion issues
        const nodeObj = node as unknown as NodeWithCallee & NodeWithArguments;
        const { callee } = nodeObj;

        if (!callee) return;

        // Check for child proxy creation (*Proxy() calls)
        const calleeType = (callee as { type: string }).type;
        if (calleeType === 'Identifier') {
          const calleeName = (callee as NodeWithName).name;
          if (calleeName?.endsWith('Proxy')) {
            // Found a child proxy creation
            const isInsideProxyFunction = currentProxyFunction !== null;
            const isBeforeReturn = isInsideProxyFunction && !foundReturnStatement;

            childProxyCreations.push({
              node: node as unknown as Tsestree,
              name: calleeName,
              isInsideProxyFunction,
              isBeforeReturn,
            });
          }
        }

        // Check if this is jest.mock() or jest.mocked()
        const isMemberExpression = callee && typeof callee === 'object' && 'object' in callee;
        if (isMemberExpression) {
          const memberCallee = callee as NodeWithObject & NodeWithProperty;
          const object = memberCallee.object as NodeWithName | undefined;
          const property = memberCallee.property as NodeWithName | undefined;

          // Check jest.mock() - must be at module level
          if (object?.name === 'jest' && property?.name === 'mock') {
            // Check if we're inside a function
            const ancestors = ctx.sourceCode?.getAncestors(node) ?? [];
            const isInsideFunction = ancestors.some((ancestor) => {
              const ancestorType = (ancestor as { type: string }).type;
              return (
                ancestorType === 'FunctionDeclaration' ||
                ancestorType === 'FunctionExpression' ||
                ancestorType === 'ArrowFunctionExpression'
              );
            });

            if (isInsideFunction) {
              ctx.report({
                node,
                messageId: 'jestMockMustBeModuleLevel',
              });
            }
          }

          // Check jest.mocked() - argument must be npm package, not implementation code
          if (object?.name === 'jest' && property?.name === 'mocked') {
            const args = nodeObj.arguments;
            if (args && args.length > 0) {
              const firstArg = args[0] as NodeWithName | undefined;
              if (firstArg?.name) {
                const argName = firstArg.name;

                // List of implementation code suffixes
                const implementationSuffixes = [
                  'Adapter',
                  'Broker',
                  'Transformer',
                  'Guard',
                  'Binding',
                  'Widget',
                  'Responder',
                  'Middleware',
                  'State',
                  'Flow',
                ];

                // Check if argument name ends with any implementation suffix
                const isImplementationCode = implementationSuffixes.some((suffix) =>
                  argName.endsWith(suffix),
                );

                if (isImplementationCode) {
                  ctx.report({
                    node,
                    messageId: 'jestMockedOnlyNpmPackages',
                    data: { name: argName },
                  });
                }
              }
            }
          }
        }
      },

      // Track when we enter a proxy function
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression':
        (node: Tsestree): void => {
          // Check if this is a proxy function
          const ancestors = ctx.sourceCode?.getAncestors(node) ?? [];
          for (const ancestor of ancestors) {
            const ancestorType = (ancestor as { type: string }).type;
            if (ancestorType === 'VariableDeclarator') {
              const declarator = ancestor as NodeWithId;
              const id = declarator.id as NodeWithName | undefined;
              if (id?.name?.endsWith('Proxy')) {
                currentProxyFunction = node;
                foundReturnStatement = false;
                break;
              }
            }
          }
        },

      // Track when we exit a proxy function
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression:exit':
        (): void => {
          currentProxyFunction = null;
          foundReturnStatement = false;
        },

      // Track return statements
      ReturnStatement: (): void => {
        if (currentProxyFunction !== null) {
          foundReturnStatement = true;
        }
      },

      // Find the exported proxy function
      ExportNamedDeclaration: (node: Tsestree): void => {
        const exportNode = node as unknown as { declaration?: Tsestree | null };
        const { declaration } = exportNode;

        if (!declaration) return;

        const declarationType = (declaration as { type: string }).type;

        // We need VariableDeclaration (export const foo = ...)
        if (declarationType !== 'VariableDeclaration') return;

        const varDecl = declaration as NodeWithDeclarations;
        const { declarations } = varDecl;
        if (!declarations || declarations.length === 0) return;

        const firstDeclaration = declarations[0] as unknown as NodeWithId & NodeWithInit;
        const id = firstDeclaration?.id as NodeWithName | undefined;
        const init = firstDeclaration?.init;

        if (!id || !init) return;

        // Check if this is a proxy function (ends with 'Proxy')
        const { name } = id;
        if (name?.endsWith('Proxy')) {
          // Check the function's return type and body
          const initType = (init as { type: string }).type;
          if (initType === 'ArrowFunctionExpression' || initType === 'FunctionExpression') {
            checkProxyFunctionReturn(init, ctx);

            // For adapter proxies, check that mock setup happens in constructor
            const isAdapterProxy = filename?.includes('-adapter.proxy.ts') ?? false;
            if (isAdapterProxy) {
              checkAdapterProxyMockSetup(init, ctx);
            }

            // Check for side effects in constructor
            checkProxyConstructorSideEffects(init, ctx);
          }
        }
      },

      // Validate child proxy creations at the end
      'Program:exit': (): void => {
        for (const creation of childProxyCreations) {
          if (!creation.isInsideProxyFunction) {
            // Child proxy created at module level
            ctx.report({
              node: creation.node,
              messageId: 'childProxyMustBeInsideFunction',
              data: { proxyName: creation.name },
            });
          } else if (!creation.isBeforeReturn) {
            // Child proxy created after return (inside methods)
            ctx.report({
              node: creation.node,
              messageId: 'childProxyMustBeInConstructor',
              data: { proxyName: creation.name },
            });
          }
        }
      },
    };
  },
});

const checkProxyFunctionReturn = (functionNode: Tsestree, context: EslintContext): void => {
  const funcNode = functionNode as NodeWithBody & NodeWithReturnType;
  const { body } = funcNode;

  if (!body) return;

  // Check explicit return type annotation if present
  const { returnType } = funcNode;
  if (returnType) {
    const { typeAnnotation } = returnType as NodeWithTypeAnnotation;
    if (typeAnnotation) {
      const typeAnnotationType = (typeAnnotation as { type: string }).type;

      // Check if return type is void, primitive, or array
      if (
        typeAnnotationType === 'TSVoidKeyword' ||
        typeAnnotationType === 'TSStringKeyword' ||
        typeAnnotationType === 'TSNumberKeyword' ||
        typeAnnotationType === 'TSBooleanKeyword' ||
        typeAnnotationType === 'TSArrayType' ||
        typeAnnotationType === 'TSTupleType'
      ) {
        context.report({
          node: functionNode,
          messageId: 'proxyMustReturnObject',
        });
        return;
      }
    }
  }

  // Check function body
  const bodyType = (body as { type: string }).type;

  if (bodyType === 'BlockStatement') {
    // Block statement has statements in its body array
    const blockNode = body as { body?: Tsestree[] };
    const statements = blockNode.body;

    if (statements) {
      let hasReturnStatement = false;

      for (const statement of statements) {
        const stmtType = (statement as { type: string }).type;
        if (stmtType === 'ReturnStatement') {
          hasReturnStatement = true;
          checkReturnStatement(statement, context, functionNode);
        }
      }

      // If no return statement found in block, it's an implicit void return
      if (!hasReturnStatement) {
        context.report({
          node: functionNode,
          messageId: 'proxyMustReturnObject',
        });
      }
    }
  } else if (bodyType === 'ObjectExpression') {
    // Arrow function with direct object return: () => ({ ... })
    checkObjectExpression(body, context);
  } else {
    // Direct return of primitives or arrays: () => 'string', () => 42, () => []
    // Check if it's returning non-object
    if (
      bodyType === 'Literal' ||
      bodyType === 'TemplateLiteral' ||
      bodyType === 'ArrayExpression' ||
      bodyType === 'Identifier'
    ) {
      context.report({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    }
  }
};

const checkReturnStatement = (
  statement: Tsestree,
  context: EslintContext,
  functionNode: Tsestree,
): void => {
  const stmtType = (statement as { type: string }).type;

  if (stmtType === 'ReturnStatement') {
    const returnStmt = statement as { argument?: Tsestree | null };
    const { argument } = returnStmt;

    if (!argument) {
      // Return with no value (void)
      context.report({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
      return;
    }

    const argType = (argument as { type: string }).type;

    // Check if returning primitive or array
    if (
      argType === 'Literal' ||
      argType === 'TemplateLiteral' ||
      argType === 'ArrayExpression' ||
      argType === 'Identifier' // Could be returning a primitive variable
    ) {
      context.report({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
      return;
    }

    // Check if returning object
    if (argType === 'ObjectExpression') {
      checkObjectExpression(argument, context);
    }
  }
};

const checkObjectExpression = (objectNode: Tsestree, context: EslintContext): void => {
  const objNode = objectNode as NodeWithProperties;
  const { properties } = objNode;

  if (!properties) return;

  // Check for bootstrap property and mock in helper names
  for (const property of properties) {
    const propType = (property as { type: string }).type;

    if (propType === 'Property' || propType === 'MethodDefinition') {
      const key = (property as NodeWithKey).key as NodeWithName | undefined;
      const keyName = key?.name;

      if (keyName === 'bootstrap') {
        context.report({
          node: property,
          messageId: 'proxyNoBootstrapMethod',
        });
      }

      // Check if helper name contains forbidden implementation-revealing words
      if (keyName) {
        const forbiddenWords = ['mock', 'stub', 'fake', 'spy', 'jest', 'dummy'];
        const foundWord = forbiddenWords.find((word) => new RegExp(word, 'i').test(keyName));

        if (foundWord) {
          context.report({
            node: property,
            messageId: 'proxyHelperNoMockInName',
            data: { name: keyName, forbiddenWord: foundWord },
          });
        }
      }
    }
  }
};

const checkAdapterProxyMockSetup = (functionNode: Tsestree, context: EslintContext): void => {
  const funcNode = functionNode as NodeWithBody;
  const { body } = funcNode;

  if (!body) return;

  const bodyType = (body as { type: string }).type;

  // Only check BlockStatement functions (not direct returns)
  if (bodyType !== 'BlockStatement') return;

  const blockNode = body as { body?: Tsestree[] };
  const statements = blockNode.body;

  if (!statements) return;

  // Find return statement position
  let returnStatementIndex = -1;
  for (let i = 0; i < statements.length; i++) {
    const stmtType = (statements[i] as { type: string }).type;
    if (stmtType === 'ReturnStatement') {
      returnStatementIndex = i;
      break;
    }
  }

  if (returnStatementIndex === -1) return;

  // Check statements before return for jest mocking calls and mock setup calls
  let hasJestMocking = false;
  let hasMockSetup = false;

  for (let i = 0; i < returnStatementIndex; i++) {
    const statement = statements[i];
    const stmtType = (statement as { type: string }).type;

    // Check for ExpressionStatement or VariableDeclaration
    if (stmtType === 'ExpressionStatement') {
      const exprStmt = statement as { expression?: Tsestree };
      const { expression } = exprStmt;

      if (expression) {
        const exprType = (expression as { type: string }).type;

        // Check for CallExpression
        if (exprType === 'CallExpression') {
          const callExpr = expression as NodeWithCallee;
          const { callee } = callExpr;

          if (callee) {
            const calleeType = (callee as { type: string }).type;

            // Check for MemberExpression (jest.spyOn, mock.mockImplementation)
            if (calleeType === 'MemberExpression') {
              const memberExpr = callee as NodeWithObject & NodeWithProperty;
              const object = memberExpr.object as NodeWithName | undefined;
              const property = memberExpr.property as NodeWithName | undefined;

              // Check if calling jest.spyOn
              if (object?.name === 'jest' && property?.name === 'spyOn') {
                hasJestMocking = true;
              }

              // Check if calling mockImplementation, mockResolvedValue, mockRejectedValue, mockReturnValue
              const mockMethods = [
                'mockImplementation',
                'mockResolvedValue',
                'mockRejectedValue',
                'mockReturnValue',
                'mockReturnValueOnce',
                'mockResolvedValueOnce',
              ];

              if (property?.name && mockMethods.includes(property.name)) {
                hasMockSetup = true;
              }
            }
          }
        }
      }
    } else if (stmtType === 'VariableDeclaration') {
      // Check for jest.mocked() or jest.spyOn() in variable declarations
      const varDecl = statement as NodeWithDeclarations;
      const { declarations } = varDecl;

      if (declarations) {
        for (const declaration of declarations) {
          const declType = (declaration as { type: string }).type;
          if (declType === 'VariableDeclarator') {
            const declarator = declaration as NodeWithInit;
            const { init } = declarator;

            if (init) {
              const initType = (init as { type: string }).type;

              // Check for CallExpression (jest.mocked(), jest.spyOn())
              if (initType === 'CallExpression') {
                const callExpr = init as NodeWithCallee;
                const { callee } = callExpr;

                if (callee) {
                  const calleeType = (callee as { type: string }).type;

                  // Check for MemberExpression (jest.mocked, jest.spyOn)
                  if (calleeType === 'MemberExpression') {
                    const memberExpr = callee as NodeWithObject & NodeWithProperty;
                    const object = memberExpr.object as NodeWithName | undefined;
                    const property = memberExpr.property as NodeWithName | undefined;

                    // Check if calling jest.mocked or jest.spyOn
                    if (
                      object?.name === 'jest' &&
                      (property?.name === 'mocked' || property?.name === 'spyOn')
                    ) {
                      hasJestMocking = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Only report if jest mocking is used but no mock setup found
  if (hasJestMocking && !hasMockSetup) {
    context.report({
      node: functionNode,
      messageId: 'adapterProxyMustSetupMocks',
    });
  }
};

const checkProxyConstructorSideEffects = (
  functionNode: Tsestree,
  context: EslintContext,
): void => {
  const funcNode = functionNode as NodeWithBody;
  const { body } = funcNode;

  if (!body) return;

  const bodyType = (body as { type: string }).type;

  // Only check BlockStatement functions (not direct returns)
  if (bodyType !== 'BlockStatement') return;

  const blockNode = body as { body?: Tsestree[] };
  const statements = blockNode.body;

  if (!statements) return;

  // Find return statement position
  let returnStatementIndex = -1;
  for (let i = 0; i < statements.length; i++) {
    const stmtType = (statements[i] as { type: string }).type;
    if (stmtType === 'ReturnStatement') {
      returnStatementIndex = i;
      break;
    }
  }

  if (returnStatementIndex === -1) return;

  // Check statements before return for side effects
  for (let i = 0; i < returnStatementIndex; i++) {
    const statement = statements[i];
    const stmtType = (statement as { type: string }).type;

    // Check for ExpressionStatement containing side effects
    if (stmtType === 'ExpressionStatement') {
      const exprStmt = statement as { expression?: Tsestree };
      const { expression } = exprStmt;

      if (expression) {
        const exprType = (expression as { type: string }).type;

        // Check for CallExpression
        if (exprType === 'CallExpression') {
          const callExpr = expression as NodeWithCallee;
          const { callee } = callExpr;

          if (callee) {
            const calleeType = (callee as { type: string }).type;

            // Check for MemberExpression (obj.method())
            if (calleeType === 'MemberExpression') {
              const memberExpr = callee as NodeWithObject & NodeWithProperty;
              const object = memberExpr.object as NodeWithName | undefined;

              // Check if it's calling a mock method (allowed)
              const property = memberExpr.property as NodeWithName | undefined;
              const propertyName = property?.name;
              const mockMethods = [
                'mockImplementation',
                'mockResolvedValue',
                'mockRejectedValue',
                'mockReturnValue',
                'mockReturnValueOnce',
                'mockResolvedValueOnce',
                'mockRejectedValueOnce',
              ];
              const isMockMethod = propertyName && mockMethods.includes(propertyName);

              if (!isMockMethod) {
                const objectName = object?.name ?? 'unknown';

                // Check if this is an allowed operation (jest or child proxy)
                const isJestOperation = objectName === 'jest';
                const isChildProxyCreation = objectName.endsWith('Proxy');
                const isAllowed = isJestOperation || isChildProxyCreation;

                // Everything else is a side effect
                if (!isAllowed) {
                  context.report({
                    node: statement as unknown as Tsestree,
                    messageId: 'proxyConstructorNoSideEffects',
                    data: { type: `${objectName}.${propertyName ?? 'method'}()` },
                  });
                }
              }
            }
          }
        }
      }
    }
  }
};
