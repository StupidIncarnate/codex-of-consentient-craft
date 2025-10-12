# ESLint Rules for Create-Per-Test Proxy Pattern

## Summary: 16 Rules Total

- **12 rules still valid** (unchanged from original)
- **4 rules obsolete** (bootstrap-related, removed)
- **4 new rules** (create-per-test pattern)

---

## ✅ Still Valid Rules (12)

### Rule 2: Tests Must Use Stubs, Not Contracts

**Status:** ✅ VALID (unchanged)

```typescript
// packages/eslint-plugin/src/rules/test-no-contracts.ts
export const testNoContracts = {
    meta: {
        messages: {
            noContracts: 'Tests must use stubs, not contracts. Import from {{stubPath}} instead.'
        }
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.test.ts') && !filename.endsWith('.test.tsx')) {
                    return;
                }

                const importPath = node.source.value;
                if (importPath.includes('-contract') && node.importKind !== 'type') {
                    const stubPath = importPath.replace('-contract', '.stub');
                    context.report({
                        node,
                        messageId: 'noContracts',
                        data: {stubPath}
                    });
                }
            }
        };
    }
};
```

---

### Rule 3: No Type Assertions in Tests

```typescript
// packages/eslint-plugin/src/rules/test-no-type-assertions.ts
export const testNoTypeAssertions = {
    meta: {
        messages: {
            noTypeAssertion: 'Use stubs to create typed values, not type assertions. Use {{stubName}} instead.'
        }
    },
    create(context) {
        return {
            TSAsExpression(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.test.ts') && !filename.endsWith('.test.tsx')) {
                    return;
                }

                // Forbid: const obj = { prop: value } as Type
                // Allow: const fn = mockFn as jest.MockedFunction<...> (only for jest types)

                const isJestType = node.typeAnnotation.typeName?.getText().includes('jest');
                if (!isJestType) {
                    context.report({
                        node,
                        messageId: 'noTypeAssertion',
                        data: {
                            stubName: `${node.typeAnnotation.typeName}Stub`
                        }
                    });
                }
            }
        };
    }
};
```

---

### Rule 4: Proxy Files Must Only Import Types from Contracts

```typescript
// packages/eslint-plugin/src/rules/proxy-no-contract-values.ts
export const proxyNoContractValues = {
    meta: {
        messages: {
            typeOnly: 'Proxy files must only import types from contracts, not the contract itself.'
        }
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) {
                    return;
                }

                const importPath = node.source.value;
                // Forbid: import { contract } from './thing-contract'
                // Allow: import type { Type } from './thing-contract'

                if (importPath.includes('-contract') && node.importKind !== 'type') {
                    context.report({
                        node,
                        messageId: 'typeOnly'
                    });
                }
            }
        };
    }
};
```

---

### Rule 5: Proxy Helpers Cannot Use "mock" in Names

```typescript
// packages/eslint-plugin/src/rules/proxy-no-mock-in-names.ts
export const proxyNoMockInNames = {
    meta: {
        messages: {
            noMock: 'Proxy helper "{{name}}" uses forbidden word "mock". Use "returns", "throws", or describe the action instead. Proxies abstract implementation (real vs mock).'
        }
    },
    create(context) {
        return {
            Property(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) {
                    return;
                }

                // Check if this is a method/property in the proxy return object
                if (node.key && node.key.type === 'Identifier') {
                    const name = node.key.name;

                    // Forbid: mockSuccess, mockError, mockAnything
                    // Allow: returns, throws, expectCalled, setupFile
                    if (name.toLowerCase().includes('mock')) {
                        context.report({
                            node,
                            messageId: 'noMock',
                            data: {name}
                        });
                    }
                }
            }
        };
    }
};
```

**Why This Rule Matters:**

The word "mock" reveals implementation details that proxies intentionally hide:

```typescript
// ❌ BAD - "mock" reveals we're using Jest mocks
fsProxy.mockSuccess(filePath, contents);
fsProxy.mockError(filePath, error);

// ✅ GOOD - Describes action, not implementation
fsProxy.returns(filePath, contents);  // "Adapter will return this"
fsProxy.throws(filePath, error);      // "Adapter will throw this"
```

**Key insight:** Tomorrow the proxy might switch from mocks to real fs in temp dir. Test code shouldn't change. Helper
names describe the adapter's behavior, not how we simulate it.

---

### Rule 6: Proxies Must Create All Child Proxies Based on Implementation Imports

**Status:** ⚠️ UPDATED (changed from bootstrap calls to proxy creation)

```typescript
// packages/eslint-plugin/src/rules/proxy-must-create-child-proxies.ts
export const proxyMustCreateChildProxies = {
    meta: {
        messages: {
            missingProxyCreation: 'Proxy imports {{implementationName}} but does not create {{proxyName}} in constructor.',
            missingProxyImport: 'Proxy imports {{implementationName}} but does not import its corresponding proxy {{proxyPath}}.'
        }
    },
    create(context) {
        return {
            Program(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) {
                    return;
                }

                const sourceCode = context.getSourceCode();
                const implementationImports = [];
                const proxyImports = [];
                const proxyCreations = [];

                // Collect all imports
                node.body.forEach(statement => {
                    if (statement.type === 'ImportDeclaration') {
                        const importPath = statement.source.value;

                        // Skip contract type imports
                        if (importPath.includes('-contract') && statement.importKind === 'type') {
                            return;
                        }

                        // Track implementation imports (adapters, brokers, widgets, etc.)
                        if (importPath.match(/\/(adapter|broker|widget|responder|transformer|guard|binding|flow|route)s?\//)) {
                            if (!importPath.includes('.proxy')) {
                                implementationImports.push({
                                    path: importPath,
                                    specifiers: statement.specifiers
                                });
                            } else {
                                proxyImports.push({
                                    path: importPath,
                                    specifiers: statement.specifiers
                                });
                            }
                        }
                    }
                });

                // Find create*Proxy function and collect child proxy creations
                node.body.forEach(statement => {
                    if (statement.type === 'ExportNamedDeclaration' &&
                        statement.declaration?.type === 'VariableDeclaration') {

                        statement.declaration.declarations.forEach(declarator => {
                            if (declarator.init?.type === 'ArrowFunctionExpression' ||
                                declarator.init?.type === 'FunctionExpression') {

                                // Scan function body for create*Proxy() calls
                                const functionBody = declarator.init.body;

                                traverseNode(functionBody, (node) => {
                                    if (node.type === 'CallExpression' &&
                                        node.callee.type === 'Identifier' &&
                                        node.callee.name.startsWith('create') &&
                                        node.callee.name.endsWith('Proxy')) {

                                        proxyCreations.push(node.callee.name);
                                    }
                                });
                            }
                        });
                    }
                });

                // Verify each implementation import has corresponding proxy import + creation
                implementationImports.forEach(({path: implPath, specifiers}) => {
                    const implName = specifiers[0]?.local.name;

                    // Derive expected proxy path and name
                    const proxyPath = implPath.replace(/(\-adapter|\-broker|\-widget|\-responder|\-transformer|\-guard|\-binding|\-flow|\-route)(\.tsx?)?$/, '$1.proxy');
                    const expectedProxyCreationName = `create${capitalize(implName)}Proxy`;

                    // Check if proxy is imported
                    const proxyImport = proxyImports.find(p => p.path === proxyPath);

                    if (!proxyImport) {
                        context.report({
                            node: specifiers[0],
                            messageId: 'missingProxyImport',
                            data: {
                                implementationName: implName,
                                proxyPath
                            }
                        });
                        return;
                    }

                    // Check if proxy is created (called in constructor)
                    if (!proxyCreations.includes(expectedProxyCreationName)) {
                        context.report({
                            node: proxyImport.specifiers[0],
                            messageId: 'missingProxyCreation',
                            data: {
                                implementationName: implName,
                                proxyName: expectedProxyCreationName
                            }
                        });
                    }
                });
            }
        };
    }
};

function traverseNode(node, callback) {
    callback(node);
    Object.keys(node).forEach(key => {
        if (node[key] && typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
                node[key].forEach(child => traverseNode(child, callback));
            } else {
                traverseNode(node[key], callback);
            }
        }
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
```

**Why This Rule Matters:**

Every implementation dependency must have its proxy created in the constructor. This ensures the proxy chain is
complete.

```typescript
// Implementation file
// widget-b.ts
import {brokerA} from '../../brokers/broker-a/broker-a';

export const WidgetB = () => {
    const data = brokerA.fetch();
    return <div>{data} < /div>;
};

// ❌ BAD - Missing proxy creation
// widget-b.proxy.ts
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';

export const createWidgetBProxy = () => {
    // ❌ ERROR: Should create brokerAProxy here!

    return {
        setupData: ({data}) => {
            // Can't setup broker - proxy wasn't created!
        }
    };
};

// ✅ GOOD - Proxy created in constructor
// widget-b.proxy.ts
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';

export const createWidgetBProxy = () => {
    // ✅ Create child proxy (sets up axios mock automatically)
    const brokerAProxy = createBrokerAProxy();

    return {
        setupData: ({data}) => {
            brokerAProxy.returns({url, response: data});
        }
    };
};
```

**Key insight:** Every implementation dependency must have its proxy created. This ensures:

1. All mocks are set up automatically (cascade down the chain)
2. Setup methods have access to child proxies
3. No manual mock management needed

---

### Rule 7: Proxy Cannot Create Child Proxies Not Used by Implementation

**Status:** ⚠️ UPDATED (changed from bootstrap to proxy creation)

```typescript
// packages/eslint-plugin/src/rules/proxy-no-phantom-dependencies.ts
export const proxyNoPhantomDependencies = {
    meta: {
        messages: {
            phantomDependency: 'Proxy creates {{proxyName}} but {{implementationFile}} does not import {{implementationName}}. Remove the phantom proxy creation or add the import to the implementation.',
            missingImplementationImport: 'Proxy imports {{implementationName}} but {{implementationFile}} does not. Proxies must only create proxies for dependencies that the implementation actually uses.'
        }
    },
    create(context) {
        return {
            Program(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) {
                    return;
                }

                // Find corresponding implementation file
                const implementationFile = filename.replace('.proxy.ts', '.ts');
                if (!fs.existsSync(implementationFile)) {
                    return;
                }

                // Read implementation file and parse imports
                const implementationSource = fs.readFileSync(implementationFile, 'utf-8');
                const implementationImports = extractImports(implementationSource);

                // Track what proxy imports and creates
                const proxyImports = [];
                const proxyCreations = [];

                // Collect proxy's implementation imports
                node.body.forEach(statement => {
                    if (statement.type === 'ImportDeclaration') {
                        const importPath = statement.source.value;

                        // Skip contract type imports
                        if (importPath.includes('-contract') && statement.importKind === 'type') {
                            return;
                        }

                        // Track implementation imports
                        if (importPath.match(/\/(adapter|broker|widget|responder|transformer|guard|binding)s?\//)) {
                            if (!importPath.includes('.proxy')) {
                                proxyImports.push({
                                    path: importPath,
                                    name: statement.specifiers[0]?.local.name,
                                    node: statement
                                });
                            }
                        }
                    }
                });

                // Find proxy factory function and collect create*Proxy() calls
                node.body.forEach(statement => {
                    if (statement.type === 'ExportNamedDeclaration' &&
                        statement.declaration?.type === 'VariableDeclaration') {

                        statement.declaration.declarations.forEach(declarator => {
                            if (declarator.init?.type === 'ArrowFunctionExpression' ||
                                declarator.init?.type === 'FunctionExpression') {

                                const functionBody = declarator.init.body;

                                traverseNode(functionBody, (node) => {
                                    if (node.type === 'CallExpression' &&
                                        node.callee.type === 'Identifier' &&
                                        node.callee.name.startsWith('create') &&
                                        node.callee.name.endsWith('Proxy')) {

                                        const proxyCreationName = node.callee.name;
                                        proxyCreations.push({
                                            name: proxyCreationName,
                                            node
                                        });
                                    }
                                });
                            }
                        });
                    }
                });

                // Verify: For each implementation import in proxy, check if implementation file imports it
                proxyImports.forEach(({path: proxyImportPath, name: proxyImportName, node: importNode}) => {
                    const implementationHasImport = implementationImports.some(
                        implImport => implImport.path === proxyImportPath ||
                            implImport.path.includes(proxyImportPath)
                    );

                    if (!implementationHasImport) {
                        context.report({
                            node: importNode,
                            messageId: 'missingImplementationImport',
                            data: {
                                implementationName: proxyImportName,
                                implementationFile: implementationFile.split('/').pop()
                            }
                        });
                    }
                });

                // Verify: For each proxy creation, ensure implementation uses that dependency
                proxyCreations.forEach(({name: proxyCreationName, node: callNode}) => {
                    // Derive implementation name from proxy creation call
                    // e.g., createBrokerAProxy -> brokerA
                    const implName = proxyCreationName
                            .replace(/^create/, '')
                            .replace(/Proxy$/, '')
                            .charAt(0).toLowerCase() +
                        proxyCreationName.replace(/^create/, '').replace(/Proxy$/, '').slice(1);

                    // Find the import for this proxy
                    const proxyImport = proxyImports.find(imp =>
                        imp.name.toLowerCase() === implName.toLowerCase()
                    );

                    if (!proxyImport) {
                        return;
                    }

                    // Check if implementation file imports this
                    const implementationHasImport = implementationImports.some(
                        implImport => implImport.name.toLowerCase() === implName.toLowerCase()
                    );

                    if (!implementationHasImport) {
                        context.report({
                            node: callNode,
                            messageId: 'phantomDependency',
                            data: {
                                proxyName: proxyCreationName,
                                implementationName: implName,
                                implementationFile: implementationFile.split('/').pop()
                            }
                        });
                    }
                });
            }
        };
    }
};

function extractImports(source) {
    const imports = [];
    const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    const namedImportRegex = /import\s+{([^}]+)}\s+from/;
    const defaultImportRegex = /import\s+(\w+)\s+from/;

    let match;
    while ((match = importRegex.exec(source)) !== null) {
        const importPath = match[1];
        const fullMatch = match[0];

        let importName = null;

        const namedMatch = namedImportRegex.exec(fullMatch);
        if (namedMatch) {
            importName = namedMatch[1].split(',')[0].trim();
        }

        const defaultMatch = defaultImportRegex.exec(fullMatch);
        if (defaultMatch) {
            importName = defaultMatch[1];
        }

        imports.push({
            path: importPath,
            name: importName
        });
    }

    return imports;
}

function traverseNode(node, callback) {
    if (!node || typeof node !== 'object') return;

    callback(node);
    Object.keys(node).forEach(key => {
        if (node[key] && typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
                node[key].forEach(child => traverseNode(child, callback));
            } else {
                traverseNode(node[key], callback);
            }
        }
    });
}
```

**Why This Rule Matters:**

Proxies must mirror the implementation's actual dependencies. If the proxy creates child proxies the implementation
doesn't use, the dependency chain is incorrect.

```typescript
// widget-b.ts (implementation)
import {brokerA} from '../../brokers/broker-a/broker-a';

export const WidgetB = () => {
    const data = brokerA.fetch();
    return <div>{data} < /div>;
};

// ❌ BAD - Proxy creates phantom dependency
// widget-b.proxy.ts
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';
import {createBrokerBProxy} from '../../brokers/broker-b/broker-b.proxy';  // ❌ WidgetB doesn't use BrokerB!

export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();
    const brokerBProxy = createBrokerBProxy();  // ❌ ERROR: widget-b.ts doesn't import brokerB

    return {...};
};

// ✅ GOOD - Proxy only creates what implementation uses
// widget-b.proxy.ts
import {createBrokerAProxy} from '../../brokers/broker-a/broker-a.proxy';

export const createWidgetBProxy = () => {
    const brokerAProxy = createBrokerAProxy();  // ✅ widget-b.ts imports brokerA

    return {...};
};
```

**Key insight:** This ensures the proxy chain perfectly mirrors the actual dependency graph. No phantom dependencies, no
missing dependencies.

---

### Rule 8: No jest.mock() on Implementation Files (Use Proxy Instead)

**Status:** ⚠️ UPDATED (expanded to all layers)

```typescript
// packages/eslint-plugin/src/rules/test-no-implementation-mocking.ts
export const testNoImplementationMocking = {
    meta: {
        messages: {
            useProxy: 'Do not mock {{layerType}} with jest.mock(). Import and use the proxy instead: {{proxyImport}}',
            useProxyForNpm: 'Do not mock npm packages directly. The adapter proxy handles this. Use: {{proxyImport}}'
        }
    },
    create(context) {
        return {
            CallExpression(node) {
                const filename = context.getFilename();

                // Only check test files
                if (!filename.endsWith('.test.ts') && !filename.endsWith('.test.tsx')) {
                    return;
                }

                // Check if this is jest.mock() call
                if (
                    node.callee.type === 'MemberExpression' &&
                    node.callee.object.name === 'jest' &&
                    node.callee.property.name === 'mock'
                ) {
                    const mockPath = node.arguments[0]?.value;
                    if (!mockPath) return;

                    // Check for all implementation layer types
                    const layerPatterns = [
                        {pattern: /-adapter/, type: 'adapter', suffix: '-adapter'},
                        {pattern: /-broker/, type: 'broker', suffix: '-broker'},
                        {pattern: /-transformer/, type: 'transformer', suffix: '-transformer'},
                        {pattern: /-guard/, type: 'guard', suffix: '-guard'},
                        {pattern: /-binding/, type: 'binding', suffix: '-binding'},
                        {pattern: /-widget/, type: 'widget', suffix: '-widget'},
                        {pattern: /-responder/, type: 'responder', suffix: '-responder'},
                        {pattern: /-flow/, type: 'flow', suffix: '-flow'},
                        {pattern: /-routes/, type: 'routes', suffix: '-routes'}
                    ];

                    for (const {pattern, type, suffix} of layerPatterns) {
                        if (mockPath.includes(suffix)) {
                            // Derive what the test file should be named
                            const expectedTestFile = mockPath.replace(/.*\/([^/]+)$/, `$1.test.ts`);

                            // Only allow if this IS the file's own test file
                            if (!filename.endsWith(expectedTestFile)) {
                                const proxyImport = mockPath.replace(suffix, `${suffix}.proxy`);
                                context.report({
                                    node,
                                    messageId: 'useProxy',
                                    data: {
                                        layerType: type,
                                        proxyImport: `import { create...Proxy } from '${proxyImport}'`
                                    }
                                });
                            }
                            return;
                        }
                    }

                    // Check for npm package mocking (should use adapter proxy)
                    const npmPackages = ['axios', 'fs', 'fs/promises', 'path', 'crypto'];
                    if (npmPackages.some(pkg => mockPath === pkg || mockPath.startsWith(`${pkg}/`))) {
                        context.report({
                            node,
                            messageId: 'useProxyForNpm',
                            data: {
                                proxyImport: `import { create...AdapterProxy } from './path-to-adapter.proxy'`
                            }
                        });
                    }
                }
            }
        };
    }
};
```

**Why This Rule Matters:**

**NEVER mock implementation files directly. Always use their proxy.**

```typescript
// ❌ BAD - Manually mocking broker in widget test
// user-card-widget.test.tsx
jest.mock('../../brokers/user/user-broker');  // ❌ ERROR!
const mockUserBroker = jest.mocked(userBroker);
mockUserBroker.fetch.mockResolvedValue(UserStub('Jane'));

render(<UserCardWidget / >);

// ✅ GOOD - Use broker proxy in widget test
// user-card-widget.test.tsx
import {createUserBrokerProxy} from '../../brokers/user/user-broker.proxy';

it('test', () => {
    const userBrokerProxy = createUserBrokerProxy();  // ✅ Use proxy
    userBrokerProxy.setupUser({userId, user});

    render(<UserCardWidget / >);
});

// ❌ BAD - Mocking npm package directly
// broker.test.ts
jest.mock('axios');  // ❌ ERROR: Use adapter proxy instead!
const mockAxios = jest.mocked(axios);

// ✅ GOOD - Use adapter proxy
// broker.test.ts
import {createHttpAdapterProxy} from '../../adapters/http/http-adapter.proxy';

it('test', () => {
    const httpProxy = createHttpAdapterProxy();  // ✅ Proxy handles axios mock
    httpProxy.returns({url, response: data});
});
```

**Exceptions (allowed):**

```typescript
// ✅ ALLOWED - File's own test mocking npm package via proxy
// http-adapter.test.ts
import {createHttpAdapterProxy} from './http-adapter.proxy';
// Proxy file contains: jest.mock('axios')

const httpProxy = createHttpAdapterProxy();  // ✅ Allowed

// ✅ ALLOWED - Mocking globals (not implementation files)
it('test', () => {
    jest.spyOn(Date, 'now').mockReturnValue(123456);  // ✅ Allowed
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('abc');  // ✅ Allowed
});
```

**Key insights:**

1. **Never** `jest.mock()` implementation files (adapters, brokers, widgets, etc.)
2. **Never** `jest.mock()` npm packages directly (use adapter proxies)
3. **Always** use proxies - they provide semantic helpers and abstraction
4. **Exception:** Globals like `Date.now()` can be mocked with `jest.spyOn()`

---

### Rule 9: Proxy Must Return Object with Helper Methods

**Status:** ⚠️ UPDATED (removed bootstrap requirement, enforces object return)

```typescript
// packages/eslint-plugin/src/rules/proxy-must-return-object.ts
export const proxyMustReturnObject = {
    meta: {
        messages: {
            mustReturnObject: 'Proxy must return an object with helper methods (e.g., returns, throws, setupX, etc.).',
            emptyObject: 'Proxy returns empty object. Add at least one helper method (e.g., returns, setupUser, etc.).'
        }
    },
    create(context) {
        return {
            Program(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) {
                    return;
                }

                // Find the exported create*Proxy function
                const exportedFunction = findExportedProxyFunction(node);
                if (!exportedFunction) return;

                // Check if it returns an object
                const returnStatement = findReturnStatement(exportedFunction);
                if (!returnStatement) {
                    context.report({
                        node: exportedFunction,
                        messageId: 'mustReturnObject'
                    });
                    return;
                }

                // Check if return value is an object literal
                if (returnStatement.argument?.type !== 'ObjectExpression') {
                    context.report({
                        node: returnStatement,
                        messageId: 'mustReturnObject'
                    });
                    return;
                }

                // Check if object has at least one method/property
                const properties = returnStatement.argument.properties;
                if (!properties || properties.length === 0) {
                    context.report({
                        node: returnStatement,
                        messageId: 'emptyObject'
                    });
                }
            }
        };
    }
};

function findExportedProxyFunction(node) {
    for (const statement of node.body) {
        if (statement.type === 'ExportNamedDeclaration' &&
            statement.declaration?.type === 'VariableDeclaration') {

            for (const declarator of statement.declaration.declarations) {
                if (declarator.id.name?.startsWith('create') &&
                    declarator.id.name?.endsWith('Proxy')) {
                    return declarator.init;
                }
            }
        }
    }
    return null;
}

function findReturnStatement(functionNode) {
    if (!functionNode) return null;

    // For arrow functions with implicit return
    if (functionNode.type === 'ArrowFunctionExpression' &&
        functionNode.body?.type === 'ObjectExpression') {
        return {argument: functionNode.body};
    }

    // For explicit return statements
    if (functionNode.body?.type === 'BlockStatement') {
        for (const statement of functionNode.body.body) {
            if (statement.type === 'ReturnStatement') {
                return statement;
            }
        }
    }

    return null;
}
```

**Why This Rule Matters:**

All proxies must return an object with helper methods. Even pure functions (transformers, guards) need proxies to
provide semantic setup helpers for higher-layer tests.

```typescript
// ❌ BAD - Not returning an object
export const createUserBrokerProxy = () => {
    const httpProxy = createHttpAdapterProxy();
    return null;  // ❌ ERROR: Must return object
};

// ❌ BAD - Returning empty object
export const createUserBrokerProxy = () => {
    const httpProxy = createHttpAdapterProxy();
    return {};  // ❌ ERROR: Must have at least one method
};

// ✅ GOOD - Returns object with helper methods
export const createUserBrokerProxy = () => {
    const httpProxy = createHttpAdapterProxy();

    return {
        setupUser: ({userId, user}) => {
            httpProxy.returns({url, response: {data: user}});
        },
        setupError: ({userId, error}) => {
            httpProxy.throws({url, error});
        }
    };
};

// ✅ GOOD - Even transformers need proxies (for semantic helpers)
export const createFormatNameTransformerProxy = () => {
    // Transformer is pure, but proxy provides semantic helpers
    return {
        setupLongName: () => {
            // Helper to create test data that exercises "long name" path
            return UserStub({firstName: 'A'.repeat(100)});
        }
    };
};

// ✅ GOOD - Adapter proxy
export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);

    mock.mockImplementation(async () => ({data: {}, status: 200}));

    return {
        returns: ({url, response}) => {
            mock.mockResolvedValueOnce(response);
        },
        throws: ({url, error}) => {
            mock.mockRejectedValueOnce(error);
        }
    };
};
```

**Key insight:**

- Proxies are NOT optional - every testable file needs one
- Proxies must provide helper methods (setup, returns, throws, etc.)
- Even pure functions need proxies for semantic test data builders
- Empty proxies are not allowed - if you can't think of helpers, you need to redesign

---

### Rule 10: Non-Adapter Proxies Cannot Use jest.mocked()

```typescript
// packages/eslint-plugin/src/rules/non-adapter-no-jest-mocked.ts
export const nonAdapterNoJestMocked = {
    meta: {
        messages: {
            noJestMocked: 'Non-adapter proxies cannot use jest.mocked(). Only adapters (I/O boundaries) should be mocked. Brokers, widgets, and responders must run real code.'
        }
    },
    create(context) {
        return {
            CallExpression(node) {
                const filename = context.getFilename();

                // Only check .proxy.ts files that are NOT adapters
                if (!filename.endsWith('.proxy.ts')) return;
                if (filename.includes('-adapter.proxy.ts')) return;

                // Check if this is jest.mocked() call
                if (
                    node.callee.type === 'MemberExpression' &&
                    node.callee.object.name === 'jest' &&
                    node.callee.property.name === 'mocked'
                ) {
                    context.report({
                        node,
                        messageId: 'noJestMocked'
                    });
                }
            }
        };
    }
};
```

**Why This Rule Matters:**

**Critical principle: Only I/O boundaries (adapters) are mocked. Business logic runs for real.**

```typescript
// ❌ BAD - Mocking a broker
// broker-a.proxy.ts
export const createBrokerAProxy = () => {
    const mock = jest.mocked(brokerA);  // ❌ ERROR: Brokers are never mocked!
    return {...};
};

// ✅ GOOD - Broker runs real code, only mocks its adapter dependency
// broker-a.proxy.ts
export const createBrokerAProxy = () => {
    const httpProxy = createHttpAdapterProxy();  // ✅ Adapter is mocked

    return {
        bootstrap: () => {
            httpProxy.bootstrap();  // Real broker code calls mocked adapter
        }
    };
};
```

---

### Rule 11: jest.mocked() Must Import What It Mocks

**Status:** ⚠️ UPDATED (clarified that adapter proxies mock npm packages)

```typescript
// packages/eslint-plugin/src/rules/jest-mocked-must-import.ts
export const jestMockedMustImport = {
    meta: {
        messages: {
            missingImport: 'jest.mocked({{name}}) requires importing {{name}}. Add: import {{importStatement}}'
        }
    },
    create(context) {
        return {
            Program(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) return;

                const sourceCode = context.getSourceCode();
                const imports = extractImports(node);
                const jestMockedCalls = findJestMockedCalls(node);

                jestMockedCalls.forEach(call => {
                    const argumentName = call.arguments[0]?.name;
                    if (!argumentName) return;

                    // Check if this name is imported
                    const hasImport = imports.some(imp =>
                        imp.specifiers.includes(argumentName)
                    );

                    if (!hasImport) {
                        // Determine import statement based on common npm packages
                        const npmPackages = ['axios', 'fs', 'crypto', 'path'];
                        const isNpmPackage = npmPackages.includes(argumentName);

                        const importStatement = isNpmPackage
                            ? `import ${argumentName} from '${argumentName}'`
                            : `import { ${argumentName} } from './path-to-module'`;

                        context.report({
                            node: call,
                            messageId: 'missingImport',
                            data: {
                                name: argumentName,
                                importStatement
                            }
                        });
                    }
                });
            }
        };
    }
};

function extractImports(node) {
    const imports = [];
    node.body.forEach(statement => {
        if (statement.type === 'ImportDeclaration') {
            const specifiers = statement.specifiers.map(spec => spec.local.name);
            imports.push({
                path: statement.source.value,
                specifiers
            });
        }
    });
    return imports;
}

function findJestMockedCalls(node) {
    const calls = [];

    function traverse(node) {
        if (!node || typeof node !== 'object') return;

        if (node.type === 'CallExpression' &&
            node.callee?.type === 'MemberExpression' &&
            node.callee.object?.name === 'jest' &&
            node.callee.property?.name === 'mocked') {
            calls.push(node);
        }

        Object.keys(node).forEach(key => {
            if (Array.isArray(node[key])) {
                node[key].forEach(child => traverse(child));
            } else if (typeof node[key] === 'object') {
                traverse(node[key]);
            }
        });
    }

    traverse(node);
    return calls;
}
```

**Why This Rule Matters:**

Adapter proxies mock **npm packages**, not adapters. This rule ensures you import what you're mocking.

```typescript
// ❌ BAD - Using jest.mocked() without importing
// http-adapter.proxy.ts
export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);  // ❌ ERROR: axios not imported!
    return {...};
};

// ✅ GOOD - Import npm package before mocking
// http-adapter.proxy.ts
import axios from 'axios';  // ✅ Import npm package

export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);  // ✅ Mocking npm package

    mock.mockImplementation(async () => ({data: {}, status: 200}));

    return {
        returns: ({url, response}) => {
            mock.mockResolvedValueOnce(response);
        }
    };
};

// ❌ BAD - Typo in package name
import axios from 'axios';

const mock = jest.mocked(axois);  // ❌ ERROR: axois (typo!) not imported

// ✅ GOOD - Correct package name
import axios from 'axios';

const mock = jest.mocked(axios);  // ✅ Matches import
```

**Key insight:** This catches typos and ensures `jest.mocked()` wraps something that actually exists.

---

### Rule 12: jest.mocked() Argument Must Be npm Package (Adapter Proxies Only)

**Status:** ⚠️ UPDATED (changed from "must be adapter" to "must be npm package")

```typescript
// packages/eslint-plugin/src/rules/jest-mocked-npm-package-only.ts
export const jestMockedNpmPackageOnly = {
    meta: {
        messages: {
            notNpmPackage: 'jest.mocked({{name}}) - In adapter proxies, only mock npm packages (axios, fs, etc.), not adapters or business logic.',
            mockingAdapter: 'jest.mocked({{name}}) - Do not mock the adapter itself. Mock the npm package it uses instead (e.g., mock axios, not httpAdapter).'
        }
    },
    create(context) {
        return {
            CallExpression(node) {
                const filename = context.getFilename();

                // Only check adapter proxy files
                if (!filename.endsWith('-adapter.proxy.ts')) return;

                // Check if this is jest.mocked() call
                if (
                    node.callee.type === 'MemberExpression' &&
                    node.callee.object.name === 'jest' &&
                    node.callee.property.name === 'mocked'
                ) {
                    const argumentName = node.arguments[0]?.name;
                    if (!argumentName) return;

                    // List of allowed npm packages
                    const npmPackages = [
                        'axios',
                        'fs',
                        'path',
                        'crypto',
                        'os',
                        'child_process',
                        'http',
                        'https',
                        'net',
                        'stream',
                        'util',
                        'zlib'
                    ];

                    // Check if it ends with "Adapter" (trying to mock the adapter itself)
                    if (argumentName.endsWith('Adapter')) {
                        context.report({
                            node,
                            messageId: 'mockingAdapter',
                            data: {name: argumentName}
                        });
                        return;
                    }

                    // Check if it's a known npm package
                    const isNpmPackage = npmPackages.some(pkg =>
                        argumentName === pkg ||
                        argumentName.startsWith(pkg)
                    );

                    if (!isNpmPackage) {
                        context.report({
                            node,
                            messageId: 'notNpmPackage',
                            data: {name: argumentName}
                        });
                    }
                }
            }
        };
    }
};
```

**Why This Rule Matters:**

Adapter proxies mock the **npm package** (I/O boundary), not the adapter itself.

```typescript
// ❌ BAD - Mocking the adapter
// http-adapter.proxy.ts
import {httpAdapter} from './http-adapter';

export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(httpAdapter);  // ❌ ERROR: Don't mock the adapter!
    return {...};
};

// ❌ BAD - Mocking business logic
// http-adapter.proxy.ts
import {userBroker} from '../../brokers/user-broker';

export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(userBroker);  // ❌ ERROR: Not an npm package!
    return {...};
};

// ✅ GOOD - Mocking npm package
// http-adapter.proxy.ts
import axios from 'axios';  // ✅ npm package

export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);  // ✅ Mocking I/O boundary

    mock.mockImplementation(async () => ({data: {}, status: 200}));

    return {
        returns: ({url, response}) => {
            mock.mockResolvedValueOnce(response);
        }
    };
};

// ✅ GOOD - Mocking fs
// fs-adapter.proxy.ts
import fs from 'fs/promises';  // ✅ npm package

export const createFsAdapterProxy = () => {
    const mock = jest.mocked(fs);  // ✅ Mocking I/O boundary

    mock.readFile.mockResolvedValue('default content');

    return {
        returns: ({path, contents}) => {
            mock.readFile.mockResolvedValueOnce(contents);
        }
    };
};
```

**Key insight:**

- **Adapter proxies** = Mock npm packages (axios, fs, etc.)
- **Other proxies** = Create child proxies, never use `jest.mocked()`
- This maintains "mock at I/O boundary" principle

---

### Rule 13: No Mutable State Inside Proxy Factory

```typescript
// packages/eslint-plugin/src/rules/proxy-no-mutable-state.ts
export const proxyNoMutableState = {
    meta: {
        messages: {
            noMutableState: 'Proxy factory cannot contain mutable state (let/var). Use module-level state or jest.mocked() references instead.',
            useModuleLevel: 'Move mutable state outside the factory function to module level.'
        }
    },
    create(context) {
        return {
            ExportNamedDeclaration(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) return;

                // Check if this is a proxy factory export (create*Proxy)
                if (node.declaration?.type === 'VariableDeclaration') {
                    const declaration = node.declaration.declarations[0];
                    if (!declaration.id.name.startsWith('create')) return;
                    if (!declaration.id.name.endsWith('Proxy')) return;

                    // Check if factory body contains let/var declarations
                    const factoryBody = declaration.init?.body || declaration.init?.expression;

                    traverseNode(factoryBody, (innerNode) => {
                        if (innerNode.type === 'VariableDeclaration') {
                            if (innerNode.kind === 'let' || innerNode.kind === 'var') {
                                // Allow jest.mocked() and child proxy creation
                                const init = innerNode.declarations[0]?.init;
                                const isJestMocked =
                                    init?.callee?.object?.name === 'jest' &&
                                    init?.callee?.property?.name === 'mocked';
                                const isChildProxy =
                                    init?.callee?.name?.startsWith('create') &&
                                    init?.callee?.name?.endsWith('Proxy');

                                if (!isJestMocked && !isChildProxy) {
                                    context.report({
                                        node: innerNode,
                                        messageId: 'noMutableState',
                                        suggest: [{
                                            messageId: 'useModuleLevel',
                                            fix: (fixer) => {
                                                // Suggest moving to module level
                                                return null;
                                            }
                                        }]
                                    });
                                }
                            }
                        }
                    });
                }
            }
        };
    }
};

function traverseNode(node, callback) {
    if (!node || typeof node !== 'object') return;
    callback(node);
    Object.keys(node).forEach(key => {
        if (node[key] && typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
                node[key].forEach(child => traverseNode(child, callback));
            } else {
                traverseNode(node[key], callback);
            }
        }
    });
}
```

---

### Rule 15: Proxy Instances Must Be Exported Const at Module Level**

```typescript
// packages/eslint-plugin/src/rules/test-proxy-must-be-exported-const.ts
export const testProxyMustBeExportedConst = {
    meta: {
        messages: {
            mustBeExported: 'Proxy instance {{name}} must be exported with "export const" at module level (before describe blocks).',
            mustBeConst: 'Proxy instance {{name}} must use "const", not "let" or "var".',
            mustBeModuleLevel: 'Proxy instance {{name}} must be created at module level, not inside describe/it blocks.'
        }
    },
    create(context) {
        return {
            VariableDeclaration(node) {
                const filename = context.getFilename();

                // Only check test files
                if (!filename.endsWith('.test.ts') && !filename.endsWith('.test.tsx')) {
                    return;
                }

                // Check if this is a proxy creation (create*Proxy call)
                node.declarations.forEach(declarator => {
                    if (
                        declarator.init?.type === 'CallExpression' &&
                        declarator.init.callee.name?.startsWith('create') &&
                        declarator.init.callee.name?.endsWith('Proxy')
                    ) {
                        const varName = declarator.id.name;

                        // Check if it's const
                        if (node.kind !== 'const') {
                            context.report({
                                node,
                                messageId: 'mustBeConst',
                                data: {name: varName}
                            });
                        }

                        // Check if it's exported
                        const parent = node.parent;
                        if (!parent || parent.type !== 'ExportNamedDeclaration') {
                            context.report({
                                node,
                                messageId: 'mustBeExported',
                                data: {name: varName}
                            });
                        }

                        // Check if it's at module level (not inside function/describe)
                        let ancestor = node.parent;
                        while (ancestor) {
                            if (
                                ancestor.type === 'CallExpression' &&
                                (ancestor.callee.name === 'describe' ||
                                    ancestor.callee.name === 'it' ||
                                    ancestor.callee.name === 'test')
                            ) {
                                context.report({
                                    node,
                                    messageId: 'mustBeModuleLevel',
                                    data: {name: varName}
                                });
                                break;
                            }
                            ancestor = ancestor.parent;
                        }
                    }
                });
            }
        };
    }
};
```

**Why This Rule Matters:**

For linting to work correctly (before transformation), proxy instances must be explicitly created and exported:

```typescript
// ❌ BAD - Not exported
const widgetProxy = createWidgetProxy();  // ❌ ERROR: Must be exported

// ❌ BAD - Using let/var
export let widgetProxy = createWidgetProxy();  // ❌ ERROR: Must be const

// ❌ BAD - Inside describe block
describe('Widget', () => {
    export const widgetProxy = createWidgetProxy();  // ❌ ERROR: Must be at module level
});

// ✅ GOOD - Exported const at module level
export const widgetProxy = createWidgetProxy();

describe('Widget', () => {
    it('test', () => {
        widgetProxy.configure({...});  // Lint sees this variable
    });
});
```

**Key insights:**

1. **Export required**: Lint sees the variable, no "undefined" errors
2. **Const required**: Proxy instances should never be reassigned
3. **Module level required**: Transformer injects bootstrap at module level, needs to find the instance

---

### Rule 17: Adapter Proxies Must Setup Mocks in Constructor

**Status:** 🆕 NEW RULE

```typescript
// packages/eslint-plugin/src/rules/adapter-proxy-must-setup-in-constructor.ts
export const adapterProxyMustSetupInConstructor = {
    meta: {
        messages: {
            missingMockSetup: 'Adapter proxy must call mock.mockImplementation() in constructor (before return statement).',
            noBootstrapMethod: 'Adapter proxy should not have a bootstrap() method. Setup mocks in constructor instead.'
        }
    },
    create(context) {
        return {
            Program(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('-adapter.proxy.ts')) {
                    return;
                }

                // Find exported create*Proxy function
                const proxyFunction = findExportedProxyFunction(node);
                if (!proxyFunction) return;

                // Check for bootstrap method (should not exist)
                const returnObject = findReturnObject(proxyFunction);
                if (returnObject) {
                    const hasBootstrap = returnObject.properties.some(
                        prop => prop.key?.name === 'bootstrap'
                    );

                    if (hasBootstrap) {
                        context.report({
                            node: returnObject,
                            messageId: 'noBootstrapMethod'
                        });
                    }
                }

                // Check for mock setup before return
                const hasMockSetup = checkForMockSetupBeforeReturn(proxyFunction);
                if (!hasMockSetup) {
                    context.report({
                        node: proxyFunction,
                        messageId: 'missingMockSetup'
                    });
                }
            }
        };
    }
};
```

**Why This Rule Matters:**

```typescript
// ❌ BAD - Has bootstrap method
export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);

    return {
        bootstrap: () => {  // ❌ Don't use bootstrap!
            mock.mockImplementation(async () => ({data: {}, status: 200}));
        },
        returns: ({url, response}) => { ...
        }
    };
};

// ✅ GOOD - Mocks setup in constructor
export const createHttpAdapterProxy = () => {
    const mock = jest.mocked(axios);

    // ✅ Setup mocks HERE (runs when proxy created)
    mock.mockImplementation(async () => ({
        data: {},
        status: 200,
        statusText: 'OK'
    }));

    return {
        returns: ({url, response}) => { ...
        }
    };
};
```

---

### Rule 18: Non-Adapter Proxies Must Create Child Proxies in Constructor

**Status:** 🆕 NEW RULE

```typescript
// packages/eslint-plugin/src/rules/proxy-must-create-children-in-constructor.ts
export const proxyMustCreateChildrenInConstructor = {
    meta: {
        messages: {
            childNotCreatedInConstructor: 'Child proxy {{proxyName}} must be created in constructor (before return statement), not inside methods.',
            noBootstrapMethod: 'Proxy should not have a bootstrap() method. Create child proxies in constructor instead.'
        }
    },
    create(context) {
        return {
            Program(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts') || filename.includes('-adapter.proxy.ts')) {
                    return;
                }

                const proxyFunction = findExportedProxyFunction(node);
                if (!proxyFunction) return;

                // Check for bootstrap method (should not exist)
                const returnObject = findReturnObject(proxyFunction);
                if (returnObject) {
                    const hasBootstrap = returnObject.properties.some(
                        prop => prop.key?.name === 'bootstrap'
                    );

                    if (hasBootstrap) {
                        context.report({
                            node: returnObject,
                            messageId: 'noBootstrapMethod'
                        });
                    }
                }

                // Check that child proxy creation happens before return
                const childProxyCreations = findChildProxyCreations(proxyFunction);
                const returnStatement = findReturnStatement(proxyFunction);

                childProxyCreations.forEach(creation => {
                    if (!isBeforeReturn(creation, returnStatement)) {
                        context.report({
                            node: creation,
                            messageId: 'childNotCreatedInConstructor',
                            data: {
                                proxyName: creation.callee.name
                            }
                        });
                    }
                });
            }
        };
    }
};
```

**Why This Rule Matters:**

```typescript
// ❌ BAD - Child proxy created inside method
export const createBrokerProxy = () => {
    return {
        bootstrap: () => {  // ❌ Don't use bootstrap!
            const httpProxy = createHttpAdapterProxy();  // ❌ Too late!
            httpProxy.bootstrap();
        }
    };
};

// ✅ GOOD - Child proxy created in constructor
export const createBrokerProxy = () => {
    // ✅ Create child proxy HERE (runs when parent proxy created)
    const httpProxy = createHttpAdapterProxy();

    return {
        setupUser: ({userId, user}) => {
            httpProxy.returns({...});  // Child already created
        }
    };
};
```

---

### Rule 19: Tests Must Create Proxy Inside Test (Not Module-Level)

**Status:** 🆕 NEW RULE (replaces Rule 15)

```typescript
// packages/eslint-plugin/src/rules/test-proxy-must-be-per-test.ts
export const testProxyMustBePerTest = {
    meta: {
        messages: {
            moduleLevelProxy: 'Proxy instance {{name}} must be created inside each test (it/test block), not at module level. Use: const {{name}} = create{{proxyName}}Proxy() inside the test.',
            exportedProxy: 'Do not export proxy instances from test files. Create proxies fresh in each test instead.'
        }
    },
    create(context) {
        return {
            VariableDeclaration(node) {
                const filename = context.getFilename();

                // Only check test files
                if (!filename.endsWith('.test.ts') && !filename.endsWith('.test.tsx')) {
                    return;
                }

                // Check if this is a proxy creation (create*Proxy call)
                node.declarations.forEach(declarator => {
                    if (
                        declarator.init?.type === 'CallExpression' &&
                        declarator.init.callee.name?.startsWith('create') &&
                        declarator.init.callee.name?.endsWith('Proxy')
                    ) {
                        const varName = declarator.id.name;

                        // Check if it's at module level (not inside it/test)
                        let ancestor = node.parent;
                        let insideTestBlock = false;

                        while (ancestor) {
                            if (
                                ancestor.type === 'CallExpression' &&
                                (ancestor.callee.name === 'it' ||
                                    ancestor.callee.name === 'test')
                            ) {
                                insideTestBlock = true;
                                break;
                            }
                            ancestor = ancestor.parent;
                        }

                        if (!insideTestBlock) {
                            const proxyName = declarator.init.callee.name
                                .replace(/^create/, '')
                                .replace(/Proxy$/, '');

                            context.report({
                                node,
                                messageId: 'moduleLevelProxy',
                                data: {
                                    name: varName,
                                    proxyName: proxyName
                                }
                            });
                        }

                        // Check if it's exported
                        const parent = node.parent;
                        if (parent && parent.type === 'ExportNamedDeclaration') {
                            context.report({
                                node,
                                messageId: 'exportedProxy',
                                data: {name: varName}
                            });
                        }
                    }
                });
            }
        };
    }
};
```

**Why This Rule Matters:**

```typescript
// ❌ BAD - Module-level proxy (old pattern)
export const brokerProxy = createUserProfileBrokerProxy();  // ❌ Created once

it('test 1', () => {
    brokerProxy.setupUser({userId, user});
});

it('test 2', () => {
    brokerProxy.setupUser({userId, user});  // ❌ Reusing same proxy
});

// ✅ GOOD - Per-test proxy (new pattern)
it('test 1', () => {
    const brokerProxy = createUserProfileBrokerProxy();  // ✅ Fresh proxy
    brokerProxy.setupUser({userId, user});
});

it('test 2', () => {
    const brokerProxy = createUserProfileBrokerProxy();  // ✅ Fresh proxy
    brokerProxy.setupUser({userId, user});
});
```

**Key insights:**

1. Each test gets fresh proxy with fresh mocks
2. Perfect test isolation
3. No beforeEach needed
4. No exported proxy instances

---

### Rule 20: Proxy Constructors Cannot Have Side Effects Beyond Mock Setup

**Status:** 🆕 NEW RULE

```typescript
// packages/eslint-plugin/src/rules/proxy-constructor-no-side-effects.ts
export const proxyConstructorNoSideEffects = {
    meta: {
        messages: {
            noSideEffects: 'Proxy constructor must only create child proxies and setup mocks. Found side effect: {{type}}. Move to setup methods instead.',
            allowedActions: 'Allowed: const childProxy = create...(), jest.mocked(...), jest.spyOn(...)'
        }
    },
    create(context) {
        return {
            Program(node) {
                const filename = context.getFilename();
                if (!filename.endsWith('.proxy.ts')) {
                    return;
                }

                const proxyFunction = findExportedProxyFunction(node);
                if (!proxyFunction) return;

                const functionBody = proxyFunction.body;
                const returnStatement = findReturnStatement(proxyFunction);

                // Check statements before return for disallowed side effects
                traverseBeforeReturn(functionBody, returnStatement, (statement) => {
                    // Allowed: const x = create...Proxy()
                    // Allowed: const mock = jest.mocked(...)
                    // Allowed: jest.spyOn(Date, 'now').mockReturnValue(...)
                    // Forbidden: fs.writeFileSync(...), console.log(...), actual I/O

                    if (statement.type === 'ExpressionStatement') {
                        const expr = statement.expression;

                        // Check for I/O operations
                        if (isIOOperation(expr)) {
                            context.report({
                                node: statement,
                                messageId: 'noSideEffects',
                                data: {
                                    type: getOperationType(expr)
                                }
                            });
                        }
                    }
                });
            }
        };
    }
};

function isIOOperation(expr) {
    // Detect: fs.writeFileSync, console.log, database calls, etc.
    if (expr.type === 'CallExpression') {
        const callee = expr.callee;

        // Check for fs, console, db operations
        if (callee.type === 'MemberExpression') {
            const objectName = callee.object.name;

            if (['fs', 'console', 'db', 'prisma', 'database'].includes(objectName)) {
                return true;
            }
        }
    }

    return false;
}
```

**Why This Rule Matters:**

```typescript
// ❌ BAD - Side effects in constructor
export const createFsAdapterProxy = () => {
    const mock = jest.mocked(fsAdapter);

    // ❌ DON'T do actual I/O in constructor!
    fs.mkdirSync('/tmp/test');  // ❌ Side effect
    fs.writeFileSync('/tmp/test/file.txt', 'data');  // ❌ Side effect
    console.log('Setting up proxy');  // ❌ Side effect

    mock.mockImplementation(async () => ({...}));

    return {...};
};

// ✅ GOOD - Only mock setup in constructor
export const createFsAdapterProxy = () => {
    const mock = jest.mocked(fsAdapter);

    // ✅ Only mock setup (no side effects)
    mock.mockImplementation(async () => ({
        contents: FileContentsStub('default')
    }));

    return {
        setupFile: ({path, contents}) => {
            // ✅ Side effects go in setup methods
            mock.mockResolvedValueOnce({contents});
        }
    };
};

// ✅ GOOD - Global mocks allowed in constructor
export const createBrokerProxy = () => {
    const httpProxy = createHttpAdapterProxy();  // ✅ Child proxy creation

    // ✅ Global function mocking is allowed
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('uuid-123');

    return {...};
};
```

**Key insights:**

1. Constructor = structural setup only (proxies + mocks)
2. No actual I/O (file system, network, console)
3. Setup methods handle scenario-specific configuration
4. Global function mocking is allowed (Date.now, crypto, etc.)

---
