# Malformed-node tests: deletion list (SD1)

Each row is a test that builds a node the real TSESTree types forbid. The branch it covers is dead once the visitor takes the real type. Delete the test and the branch together; a test marked "edit" also holds valid cases, so only its malformed case goes.

Roots seen: 916. Root classes: ok 771, malformed:parent-null 18, unprintable:parent-chain-differs 13, unprintable:printed-code-does-not-parse 15, unprintable:expr 16, unprintable:template-shape 3, malformed:wrong-node-in-slot 8, malformed:missing-field 44, malformed:array-or-scalar-where-node 4, unprintable:shorthand-var 3, unprintable:type-not-node 2, unprintable:parent-same-type-in-chain 10, unprintable:parent-no-slot 1, unprintable:type-not-literal 2, unprintable:printed-code-has-no-FunctionDeclaration 1, unprintable:roundtrip-mismatch 2, malformed:wrong-length 1, unprintable:no-printer 1, unprintable:no-root-wrapper 1.
Tests listed: 74, of which delete-whole: 65, edit: 9.

## packages/eslint-plugin/src/brokers/rule/ban-primitives/check-primitive-violation-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/ban-primitives/check-primitive-violation-layer-broker.ts`

- **edit** line 44, `INVALID: {allowPrimitiveInputs: true, node in return type} => reports error` — missing/wrong: parent (roots 51; parent-null)
  - dead branch: no line reads these fields in a condition; read the visitor

- **edit** line 119, `VALID: {allowPrimitiveInputs: true, node in destructured parameter with a default value} => does not report` — missing/wrong: parent (roots 127; parent-null)
  - dead branch: no line reads these fields in a condition; read the visitor

- **edit** line 166, `VALID: {allowPrimitiveInputs: true, node in direct parameter with a default value} => does not report` — missing/wrong: parent (roots 173; parent-null)
  - dead branch: no line reads these fields in a condition; read the visitor

## packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.ts`

- **delete** line 525, `VALID: guard returning type predicate => does not report` — missing/wrong: typeAnnotation (roots 529; wrong-node-in-slot)
  - dead branch candidate check-folder-return-type-layer-broker.ts:46 (typeAnnotation): `if (!typeAnnotation) {`
  - dead branch candidate check-folder-return-type-layer-broker.ts:50 (typeAnnotation): `const typeArgs = typeAnnotation.typeArguments ?? typeAnnotation.typeParameters;`
  - dead branch candidate check-folder-return-type-layer-broker.ts:101 (typeAnnotation): `typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName?.name === 'Promise';`
  - dead branch candidate check-folder-return-type-layer-broker.ts:125 (typeAnnotation): `if (typeAnnotation.type === 'TSUnknownKeyword') {`
  - dead branch candidate check-folder-return-type-layer-broker.ts:133 (typeAnnotation): `if (typeAnnotation.type === 'TSObjectKeyword') {`
  - dead branch candidate check-folder-return-type-layer-broker.ts:148 (typeAnnotation): `typeAnnotation.type === 'TSTypeReference' &&`

## packages/eslint-plugin/src/brokers/rule/enforce-harness-patterns/validate-harness-constructor-side-effects-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/enforce-harness-patterns/validate-harness-constructor-side-effects-layer-broker.ts`

- **delete** line 8, `EMPTY: {body: undefined} => does not report` — missing/wrong: body (roots 12; missing-field)
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:25 (body): `if (!body) return result;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:27 (body): `if (Array.isArray(body)) return result;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:29 (body): `if (body.type !== 'BlockStatement') return result;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:31 (body): `if (!body.body || !Array.isArray(body.body)) return result;`

- **delete** line 24, `EDGE: {body: []} => does not report` — missing/wrong: body (roots 28; array-or-scalar-where-node)
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:25 (body): `if (!body) return result;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:27 (body): `if (Array.isArray(body)) return result;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:29 (body): `if (body.type !== 'BlockStatement') return result;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:31 (body): `if (!body.body || !Array.isArray(body.body)) return result;`

- **delete** line 40, `EDGE: {body.type: BlockStatement, body.body: undefined} => does not report` — missing/wrong: body (roots 44; missing-field)
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:25 (body): `if (!body) return result;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:27 (body): `if (Array.isArray(body)) return result;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:29 (body): `if (body.type !== 'BlockStatement') return result;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:31 (body): `if (!body.body || !Array.isArray(body.body)) return result;`

- **delete** line 578, `EDGE: {ExpressionStatement with no expression} => does not report` — missing/wrong: expression (roots 582; missing-field)
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:103 (expression): `if (!expression) continue;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:105 (expression): `if (expression.type === 'AssignmentExpression') {`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:114 (expression): `if (expression.type !== 'CallExpression') continue;`

- **delete** line 607, `EDGE: {CallExpression with no callee} => does not report` — missing/wrong: callee (roots 611; missing-field)
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:117 (callee): `if (!callee) continue;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:119 (callee): `if (callee.type === 'ArrowFunctionExpression' || callee.type === 'FunctionExpression') {`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:128 (callee): `if (callee.type === 'Identifier') {`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:146 (callee): `if (callee.type === 'MemberExpression') {`

- **delete** line 639, `EDGE: {Identifier callee with undefined name} => does not report` — missing/wrong: name (roots 643; missing-field)
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:64 (name): `if (!name) continue;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:84 (name): `objectName: object?.name,`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:85 (name): `propertyName: property?.name,`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:88 (name): `const objectName = object?.name ?? 'unknown';`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:92 (name): `data: { type: '${objectName}.${property?.name ?? 'method'}()' },`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:130 (name): `if (!name) continue;`

- **delete** line 668, `EDGE: {MemberExpression with undefined property name} => reports with fallback method name` — missing/wrong: name (roots 672, 683; missing-field)
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:64 (name): `if (!name) continue;`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:84 (name): `objectName: object?.name,`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:85 (name): `propertyName: property?.name,`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:88 (name): `const objectName = object?.name ?? 'unknown';`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:92 (name): `data: { type: '${objectName}.${property?.name ?? 'method'}()' },`
  - dead branch candidate validate-harness-constructor-side-effects-layer-broker.ts:130 (name): `if (!name) continue;`

## packages/eslint-plugin/src/brokers/rule/enforce-project-structure/collect-exports-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/enforce-project-structure/collect-exports-layer-broker.ts`

- **delete** line 9, `VALID: arrow function variable declaration => collects export` — missing/wrong: declarations (roots 14; wrong-node-in-slot)
  - dead branch candidate collect-exports-layer-broker.ts:59 (declarations): `if (declaration.type === 'VariableDeclaration' && declaration.declarations) {`

- **delete** line 182, `EMPTY: body is undefined => returns empty array` — missing/wrong: body (roots 186; missing-field)
  - dead branch candidate collect-exports-layer-broker.ts:28 (body): `if (!body || !Array.isArray(body)) {`

- **delete** line 403, `INVALID: non-arrow variable in proxy file => reports proxyMustBeArrowFunction` — missing/wrong: declarations (roots 408; wrong-node-in-slot)
  - dead branch candidate collect-exports-layer-broker.ts:59 (declarations): `if (declaration.type === 'VariableDeclaration' && declaration.declarations) {`

- **delete** line 451, `VALID: arrow function broker => collects without error` — missing/wrong: declarations (roots 457; wrong-node-in-slot)
  - dead branch candidate collect-exports-layer-broker.ts:59 (declarations): `if (declaration.type === 'VariableDeclaration' && declaration.declarations) {`

- **delete** line 495, `VALID: arrow function proxy => collects without error` — missing/wrong: declarations (roots 501; wrong-node-in-slot)
  - dead branch candidate collect-exports-layer-broker.ts:59 (declarations): `if (declaration.type === 'VariableDeclaration' && declaration.declarations) {`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-adapter-mock-setup-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-adapter-mock-setup-layer-broker.ts`

- **delete** line 8, `EMPTY: {body: undefined} => does not report` — missing/wrong: body (roots 12; missing-field)
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:24 (body): `if (!body) return result;`
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:26 (body): `if (Array.isArray(body)) return result;`
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:28 (body): `if (body.type !== 'BlockStatement') return result;`
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:30 (body): `if (!body.body || !Array.isArray(body.body)) return result;`

- **delete** line 24, `EDGE: {body: []} => does not report` — missing/wrong: body (roots 28; array-or-scalar-where-node)
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:24 (body): `if (!body) return result;`
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:26 (body): `if (Array.isArray(body)) return result;`
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:28 (body): `if (body.type !== 'BlockStatement') return result;`
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:30 (body): `if (!body.body || !Array.isArray(body.body)) return result;`

- **delete** line 59, `EDGE: {body.type: BlockStatement, body.body: undefined} => does not report` — missing/wrong: body (roots 63; missing-field)
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:24 (body): `if (!body) return result;`
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:26 (body): `if (Array.isArray(body)) return result;`
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:28 (body): `if (body.type !== 'BlockStatement') return result;`
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:30 (body): `if (!body.body || !Array.isArray(body.body)) return result;`

- **delete** line 725, `EDGE: {ExpressionStatement with no expression} => does not report` — missing/wrong: expression (roots 729; missing-field)
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:56 (expression): `if (expression) {`
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:58 (expression): `if (expression.type === 'CallExpression') {`

- **delete** line 754, `EDGE: {VariableDeclaration with no declarations} => does not report` — missing/wrong: declarations (roots 758; missing-field)
  - dead branch candidate validate-adapter-mock-setup-layer-broker.ts:88 (declarations): `if (declarations) {`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-no-exposed-child-proxies-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-no-exposed-child-proxies-layer-broker.ts`

- **delete** line 11, `EMPTY: {properties: undefined} => does not report` — missing/wrong: properties (roots 15; missing-field)
  - dead branch candidate validate-no-exposed-child-proxies-layer-broker.ts:25 (properties): `if (!properties) return result;`

- **delete** line 471, `EDGE: {property.key: undefined} => does not report` — missing/wrong: key (roots 475; missing-field)
  - dead branch candidate validate-no-exposed-child-proxies-layer-broker.ts:33 (key): `if (shorthand && key?.name) {`
  - dead branch candidate validate-no-exposed-child-proxies-layer-broker.ts:34 (key): `if (proxyVariables.has(key.name)) {`

- **delete** line 498, `EDGE: {property.key.name: undefined} => does not report` — missing/wrong: name (roots 502; missing-field)
  - dead branch candidate validate-no-exposed-child-proxies-layer-broker.ts:33 (name): `if (shorthand && key?.name) {`
  - dead branch candidate validate-no-exposed-child-proxies-layer-broker.ts:34 (name): `if (proxyVariables.has(key.name)) {`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-object-expression-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-object-expression-layer-broker.ts`

- **delete** line 8, `EMPTY: {properties: undefined} => does not report` — missing/wrong: properties (roots 12; missing-field)
  - dead branch candidate validate-object-expression-layer-broker.ts:24 (properties): `if (!properties) return result;`

- **delete** line 82, `VALID: {property.type: MethodDefinition, key.name: "setupProxy"} => does not report` — missing/wrong: properties (roots 86; wrong-node-in-slot)
  - dead branch candidate validate-object-expression-layer-broker.ts:24 (properties): `if (!properties) return result;`

- **edit** line 132, `INVALID: {property.type: MethodDefinition, key.name: "bootstrap"} => reports proxyNoBootstrapMethod` — missing/wrong: properties (roots 144; wrong-node-in-slot)
  - dead branch candidate validate-object-expression-layer-broker.ts:24 (properties): `if (!properties) return result;`

- **delete** line 371, `EDGE: {property.key: undefined} => does not report` — missing/wrong: key (roots 375; missing-field)
  - dead branch candidate validate-object-expression-layer-broker.ts:30 (key): `const keyName = key?.name;`

- **delete** line 390, `EDGE: {property.key.name: undefined} => does not report` — missing/wrong: name (roots 394; missing-field)
  - dead branch candidate validate-object-expression-layer-broker.ts:30 (name): `const keyName = key?.name;`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-proxy-constructor-side-effects-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-proxy-constructor-side-effects-layer-broker.ts`

- **delete** line 8, `EMPTY: {body: undefined} => does not report` — missing/wrong: body (roots 12; missing-field)
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:24 (body): `if (!body) return result;`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:26 (body): `if (Array.isArray(body)) return result;`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:28 (body): `if (body.type !== 'BlockStatement') return result;`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:30 (body): `if (!body.body || !Array.isArray(body.body)) return result;`

- **delete** line 24, `EDGE: {body: []} => does not report` — missing/wrong: body (roots 28; array-or-scalar-where-node)
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:24 (body): `if (!body) return result;`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:26 (body): `if (Array.isArray(body)) return result;`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:28 (body): `if (body.type !== 'BlockStatement') return result;`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:30 (body): `if (!body.body || !Array.isArray(body.body)) return result;`

- **delete** line 59, `EDGE: {body.type: BlockStatement, body.body: undefined} => does not report` — missing/wrong: body (roots 63; missing-field)
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:24 (body): `if (!body) return result;`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:26 (body): `if (Array.isArray(body)) return result;`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:28 (body): `if (body.type !== 'BlockStatement') return result;`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:30 (body): `if (!body.body || !Array.isArray(body.body)) return result;`

- **delete** line 765, `EDGE: {ExpressionStatement with no expression} => does not report` — missing/wrong: expression (roots 769; missing-field)
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:53 (expression): `if (expression) {`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:55 (expression): `if (expression.type === 'CallExpression') {`

- **delete** line 794, `EDGE: {CallExpression with no callee} => does not report` — missing/wrong: callee (roots 798; missing-field)
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:58 (callee): `if (callee) {`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:60 (callee): `if (callee.type === 'MemberExpression') {`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:82 (callee): `object?.type === 'CallExpression' && object.callee?.type === 'MemberExpression'`
  - dead branch candidate validate-proxy-constructor-side-effects-layer-broker.ts:83 (callee): `? object.callee.property?.name`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-proxy-function-return-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-proxy-function-return-layer-broker.ts`

- **delete** line 8, `EMPTY: {body: undefined} => does not report` — missing/wrong: body (roots 12; missing-field)
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:25 (body): `if (!body) return result;`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:51 (body): `if (Array.isArray(body)) {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:55 (body): `if (body.type === 'BlockStatement') {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:57 (body): `if (body.body && Array.isArray(body.body)) {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:76 (body): `} else if (body.type === 'ObjectExpression') {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:82 (body): `body.type === 'Literal' ||`

- **delete** line 138, `EDGE: {body: []} => does not report` — missing/wrong: body (roots 142; array-or-scalar-where-node)
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:25 (body): `if (!body) return result;`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:51 (body): `if (Array.isArray(body)) {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:55 (body): `if (body.type === 'BlockStatement') {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:57 (body): `if (body.body && Array.isArray(body.body)) {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:76 (body): `} else if (body.type === 'ObjectExpression') {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:82 (body): `body.type === 'Literal' ||`

- **delete** line 208, `EDGE: {body.type: BlockStatement, body.body: undefined} => does not report` — missing/wrong: body (roots 212; missing-field)
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:25 (body): `if (!body) return result;`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:51 (body): `if (Array.isArray(body)) {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:55 (body): `if (body.type === 'BlockStatement') {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:57 (body): `if (body.body && Array.isArray(body.body)) {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:76 (body): `} else if (body.type === 'ObjectExpression') {`
  - dead branch candidate validate-proxy-function-return-layer-broker.ts:82 (body): `body.type === 'Literal' ||`

## packages/eslint-plugin/src/brokers/rule/gateway-colocation/barrel-named-reexports-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/gateway-colocation/barrel-named-reexports-layer-broker.ts`

- **delete** line 97, `EMPTY: {body is undefined} => returns an empty array` — missing/wrong: body (roots 99; missing-field)
  - dead branch candidate barrel-named-reexports-layer-broker.ts:22 (body): `const statements = Array.isArray(node.body) ? node.body : [];`

## packages/eslint-plugin/src/brokers/rule/gateway-return-unknown-not-caller-type/check-any-leak-return-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/gateway-return-unknown-not-caller-type/check-any-leak-return-layer-broker.ts`

- **edit** line 17, `VALID: {return JSON.parse(text) directly, no declared return type} => reports anyLeakNoReturnType` — missing/wrong: parent (roots 21; parent-null)
  - dead branch: no line reads these fields in a condition; read the visitor

- **edit** line 44, `VALID: {const data = JSON.parse(text); return data;, no declared return type} => reports anyLeakNoReturnType` — missing/wrong: parent (roots 48; parent-null)
  - dead branch: no line reads these fields in a condition; read the visitor

- **edit** line 80, `EMPTY: {enclosing function declares a return type} => reports nothing` — missing/wrong: parent (roots 84; parent-null)
  - dead branch: no line reads these fields in a condition; read the visitor

- **edit** line 108, `EMPTY: {returned identifier traces to a non-JSON.parse/import initializer} => reports nothing` — missing/wrong: parent (roots 112; parent-null)
  - dead branch: no line reads these fields in a condition; read the visitor

## packages/eslint-plugin/src/brokers/rule/platform-globals-ban/is-object-literal-key-label-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/is-object-literal-key-label-layer-broker.ts`

- **delete** line 23, `EMPTY: {no parent} => returns false` — missing/wrong: parent (roots 25; parent-null)
  - dead branch candidate is-object-literal-key-label-layer-broker.ts:15 (parent): `node.parent?.type === 'Property' && node.parent.key === node;`

## packages/eslint-plugin/src/brokers/rule/platform-globals-ban/is-type-position-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/is-type-position-layer-broker.ts`

- **delete** line 42, `EMPTY: {no parent} => returns false` — missing/wrong: parent (roots 44; parent-null)
  - dead branch candidate is-type-position-layer-broker.ts:15 (parent): `const parentType = node.parent?.type;`

## packages/eslint-plugin/src/brokers/rule/platform-globals-ban/property-identifier-to-check-layer-broker.test.ts

Production file: `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/property-identifier-to-check-layer-broker.ts`

- **delete** line 13, `VALID: {no parent} => returns the same node` — missing/wrong: parent (roots 15; parent-null)
  - dead branch candidate property-identifier-to-check-layer-broker.ts:22 (parent): `if (parent?.type !== 'MemberExpression' || parent.property !== node || parent.computed) {`

## packages/eslint-plugin/src/guards/is-ast-brand-in-chain/is-ast-brand-in-chain-guard.test.ts

Production file: `packages/eslint-plugin/src/guards/is-ast-brand-in-chain/is-ast-brand-in-chain-guard.ts`

- **delete** line 97, `INVALID: {node: z.string() without .brand()} => returns false` — missing/wrong: parent (roots 98; parent-null)
  - dead branch: no line reads these fields in a condition; read the visitor

- **edit** line 106, `INVALID: {node: z.string().email() without .brand()} => returns false` — missing/wrong: parent (roots 107; parent-null)
  - dead branch: no line reads these fields in a condition; read the visitor

- **delete** line 174, `EMPTY: {node: with null parent} => returns false` — missing/wrong: parent (roots 175; parent-null)
  - dead branch: no line reads these fields in a condition; read the visitor

## packages/eslint-plugin/src/guards/is-ast-callback-function/is-ast-callback-function-guard.test.ts

Production file: `packages/eslint-plugin/src/guards/is-ast-callback-function/is-ast-callback-function-guard.ts`

- **delete** line 57, `INVALID: {funcNode: function with no parent} => returns false` — missing/wrong: parent (roots 58; parent-null)
  - dead branch candidate is-ast-callback-function-guard.ts:14 (parent): `funcNode?.parent?.type === 'CallExpression';`

## packages/eslint-plugin/src/guards/is-ast-contract-parse-call/is-ast-contract-parse-call-guard.test.ts

Production file: `packages/eslint-plugin/src/guards/is-ast-contract-parse-call/is-ast-contract-parse-call-guard.ts`

- **delete** line 106, `EMPTY: {CallExpression with no callee} => returns false` — missing/wrong: callee (roots 107; missing-field)
  - dead branch candidate is-ast-contract-parse-call-guard.ts:14 (callee): `if (node === undefined || node.type !== 'CallExpression' || !node.callee) {`
  - dead branch candidate is-ast-contract-parse-call-guard.ts:19 (callee): `if (callee.type !== 'MemberExpression') {`

## packages/eslint-plugin/src/guards/is-ast-function-params-destructured/is-ast-function-params-destructured-guard.test.ts

Production file: `packages/eslint-plugin/src/guards/is-ast-function-params-destructured/is-ast-function-params-destructured-guard.ts`

- **delete** line 65, `VALID: {funcNode: function with undefined params} => returns true` — missing/wrong: params (roots 66; missing-field)
  - dead branch candidate is-ast-function-params-destructured-guard.ts:18 (params): `if (!funcNode?.params || funcNode.params.length === 0) {`

## packages/eslint-plugin/src/guards/is-ast-function-uses-contract-parse/is-ast-function-uses-contract-parse-guard.test.ts

Production file: `packages/eslint-plugin/src/guards/is-ast-function-uses-contract-parse/is-ast-function-uses-contract-parse-guard.ts`

- **delete** line 290, `EMPTY: {function with no body} => returns false` — missing/wrong: body (roots 291; missing-field)
  - dead branch candidate is-ast-function-uses-contract-parse-guard.ts:25 (body): `if (!body) {`
  - dead branch candidate is-ast-function-uses-contract-parse-guard.ts:30 (body): `if (Array.isArray(body)) {`
  - dead branch candidate is-ast-function-uses-contract-parse-guard.ts:35 (body): `if (body.type === 'CallExpression') {`
  - dead branch candidate is-ast-function-uses-contract-parse-guard.ts:40 (body): `if (body.type === 'ObjectExpression') {`
  - dead branch candidate is-ast-function-uses-contract-parse-guard.ts:45 (body): `if (body.type === 'BlockStatement' && body.body && Array.isArray(body.body)) {`

- **delete** line 311, `EMPTY: {function with BlockStatement but no body array} => returns false` — missing/wrong: body (roots 312; missing-field)
  - dead branch candidate is-ast-function-uses-contract-parse-guard.ts:25 (body): `if (!body) {`
  - dead branch candidate is-ast-function-uses-contract-parse-guard.ts:30 (body): `if (Array.isArray(body)) {`
  - dead branch candidate is-ast-function-uses-contract-parse-guard.ts:35 (body): `if (body.type === 'CallExpression') {`
  - dead branch candidate is-ast-function-uses-contract-parse-guard.ts:40 (body): `if (body.type === 'ObjectExpression') {`
  - dead branch candidate is-ast-function-uses-contract-parse-guard.ts:45 (body): `if (body.type === 'BlockStatement' && body.body && Array.isArray(body.body)) {`

## packages/eslint-plugin/src/guards/is-ast-method-call/is-ast-method-call-guard.test.ts

Production file: `packages/eslint-plugin/src/guards/is-ast-method-call/is-ast-method-call-guard.ts`

- **delete** line 140, `EMPTY: {callee.object has no name} => returns false` — missing/wrong: name (roots 141; missing-field)
  - dead branch candidate is-ast-method-call-guard.ts:24 (name): `node.callee.object.name === object &&`

- **delete** line 159, `EMPTY: {callee.property has no name} => returns false` — missing/wrong: name (roots 160; missing-field)
  - dead branch candidate is-ast-method-call-guard.ts:24 (name): `node.callee.object.name === object &&`

## packages/eslint-plugin/src/guards/is-ast-node-exported/is-ast-node-exported-guard.test.ts

Production file: `packages/eslint-plugin/src/guards/is-ast-node-exported/is-ast-node-exported-guard.ts`

- **delete** line 64, `EMPTY: {node without parent} => returns false` — missing/wrong: parent (roots 65; parent-null)
  - dead branch: no line reads these fields in a condition; read the visitor

## packages/eslint-plugin/src/guards/is-ast-object-contract-parse-spread/is-ast-object-contract-parse-spread-guard.test.ts

Production file: `packages/eslint-plugin/src/guards/is-ast-object-contract-parse-spread/is-ast-object-contract-parse-spread-guard.ts`

- **delete** line 149, `EMPTY: {ObjectExpression with properties: undefined} => returns false` — missing/wrong: properties (roots 150; missing-field)
  - dead branch candidate is-ast-object-contract-parse-spread-guard.ts:15 (properties): `if (node === undefined || node.type !== 'ObjectExpression' || !node.properties) {`

## packages/eslint-plugin/src/guards/is-ast-object-stub-spread/is-ast-object-stub-spread-guard.test.ts

Production file: `packages/eslint-plugin/src/guards/is-ast-object-stub-spread/is-ast-object-stub-spread-guard.ts`

- **delete** line 168, `EMPTY: {ObjectExpression with properties: undefined} => returns false` — missing/wrong: properties (roots 169; missing-field)
  - dead branch candidate is-ast-object-stub-spread-guard.ts:14 (properties): `if (node === undefined || node.type !== 'ObjectExpression' || !node.properties) {`
  - dead branch candidate is-ast-object-stub-spread-guard.ts:18 (properties): `if (node.properties.length === 0) {`

## packages/eslint-plugin/src/guards/is-ingredient-declaration-call/is-ingredient-declaration-call-guard.test.ts

Production file: `packages/eslint-plugin/src/guards/is-ingredient-declaration-call/is-ingredient-declaration-call-guard.ts`

- **delete** line 64, `EMPTY: {CallExpression with no callee} => returns false` — missing/wrong: callee (roots 65; missing-field)
  - dead branch candidate is-ingredient-declaration-call-guard.ts:28 (callee): `callee?.type === 'Identifier' &&`

## packages/eslint-plugin/src/transformers/ast-callee-root-name/ast-callee-root-name-transformer.test.ts

Production file: `packages/eslint-plugin/src/transformers/ast-callee-root-name/ast-callee-root-name-transformer.ts`

- **delete** line 138, `EDGE: {node: no callee} => returns null` — missing/wrong: callee (roots 139; missing-field)
  - dead branch candidate ast-callee-root-name-transformer.ts:16 (callee): `const { callee } = node ?? {};`
  - dead branch candidate ast-callee-root-name-transformer.ts:17 (callee): `if (!callee) return null;`
  - dead branch candidate ast-callee-root-name-transformer.ts:20 (callee): `if (callee.type === 'Identifier' && callee.name) {`
  - dead branch candidate ast-callee-root-name-transformer.ts:26 (callee): `callee.type === 'MemberExpression' &&`
  - dead branch candidate ast-callee-root-name-transformer.ts:27 (callee): `callee.object?.type === 'Identifier' &&`
  - dead branch candidate ast-callee-root-name-transformer.ts:34 (callee): `if (callee.type === 'CallExpression') {`

## packages/eslint-plugin/src/transformers/ast-get-call-first-argument-name/ast-get-call-first-argument-name-transformer.test.ts

Production file: `packages/eslint-plugin/src/transformers/ast-get-call-first-argument-name/ast-get-call-first-argument-name-transformer.ts`

- **delete** line 152, `EMPTY: {node: CallExpression with undefined arguments} => returns null` — missing/wrong: arguments (roots 153; missing-field)
  - dead branch candidate ast-get-call-first-argument-name-transformer.ts:16 (arguments): `if (!node?.arguments || node.arguments.length === 0) {`

- **delete** line 164, `EDGE: {node: Identifier with no name} => returns null` — missing/wrong: name (roots 165; missing-field)
  - dead branch candidate ast-get-call-first-argument-name-transformer.ts:21 (name): `if (firstArg && firstArg.type === 'Identifier' && firstArg.name) {`

- **delete** line 176, `EDGE: {node: Identifier with empty string name} => returns null` — missing/wrong: arguments (roots 177; wrong-length)
  - dead branch candidate ast-get-call-first-argument-name-transformer.ts:16 (arguments): `if (!node?.arguments || node.arguments.length === 0) {`

## packages/eslint-plugin/src/transformers/ast-get-imports/ast-get-imports-transformer.test.ts

Production file: `packages/eslint-plugin/src/transformers/ast-get-imports/ast-get-imports-transformer.ts`

- **delete** line 143, `EMPTY: {node: ImportDeclaration with no source} => returns empty Map` — missing/wrong: source (roots 144; missing-field)
  - dead branch candidate ast-get-imports-transformer.ts:22 (source): `const source = node.source?.value;`
  - dead branch candidate ast-get-imports-transformer.ts:24 (source): `if (typeof source !== 'string') {`

- **delete** line 189, `EDGE: {node: ImportDeclaration with specifier missing local name} => skips that specifier` — missing/wrong: local, name (roots 190; missing-field)
  - dead branch candidate ast-get-imports-transformer.ts:33 (local): `if (spec.type === 'ImportSpecifier' && spec.local?.name) {`
  - dead branch candidate ast-get-imports-transformer.ts:36 (local): `} else if (spec.type === 'ImportDefaultSpecifier' && spec.local?.name) {`
  - dead branch candidate ast-get-imports-transformer.ts:39 (local): `} else if (spec.type === 'ImportNamespaceSpecifier' && spec.local?.name) {`

## packages/eslint-plugin/src/transformers/ast-get-member-expression-root/ast-get-member-expression-root-transformer.test.ts

Production file: `packages/eslint-plugin/src/transformers/ast-get-member-expression-root/ast-get-member-expression-root-transformer.ts`

- **delete** line 136, `EDGE: {expr: MemberExpression with object undefined} => returns null` — missing/wrong: object (roots 137; missing-field)
  - dead branch: no line reads these fields in a condition; read the visitor

- **delete** line 148, `EDGE: {expr: Identifier with no name} => returns null` — missing/wrong: name (roots 149; missing-field)
  - dead branch: no line reads these fields in a condition; read the visitor

## packages/eslint-plugin/src/transformers/type-name-from-annotation/type-name-from-annotation-transformer.test.ts

Production file: `packages/eslint-plugin/src/transformers/type-name-from-annotation/type-name-from-annotation-transformer.ts`

- **delete** line 82, `EDGE: {type: TSTypeReference without typeName} => returns null` — missing/wrong: typeName (roots 83; missing-field)
  - dead branch candidate type-name-from-annotation-transformer.ts:32 (typeName): `if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName) {`
  - dead branch candidate type-name-from-annotation-transformer.ts:34 (typeName): `if (typeAnnotation.typeName.type === 'Identifier' && typeAnnotation.typeName.name) {`
  - dead branch candidate type-name-from-annotation-transformer.ts:54 (typeName): `typeAnnotation.typeName?.type === 'Identifier' &&`

- **delete** line 93, `EDGE: {type: TSTypeReference with non-Identifier typeName} => returns null` — missing/wrong: typeName (roots 94; wrong-node-in-slot)
  - dead branch candidate type-name-from-annotation-transformer.ts:32 (typeName): `if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName) {`
  - dead branch candidate type-name-from-annotation-transformer.ts:34 (typeName): `if (typeAnnotation.typeName.type === 'Identifier' && typeAnnotation.typeName.name) {`
  - dead branch candidate type-name-from-annotation-transformer.ts:54 (typeName): `typeAnnotation.typeName?.type === 'Identifier' &&`

- **delete** line 106, `EDGE: {type: TSTypeReference with Identifier but no name} => returns null` — missing/wrong: name (roots 107; missing-field)
  - dead branch candidate type-name-from-annotation-transformer.ts:34 (name): `if (typeAnnotation.typeName.type === 'Identifier' && typeAnnotation.typeName.name) {`

## packages/eslint-plugin/src/transformers/validate-function-params-use-object-destructuring/validate-function-params-use-object-destructuring-transformer.test.ts

Production file: `packages/eslint-plugin/src/transformers/validate-function-params-use-object-destructuring/validate-function-params-use-object-destructuring-transformer.ts`

- **delete** line 7, `EMPTY: {params: undefined} => does not report` — missing/wrong: params (roots 10; missing-field)
  - dead branch candidate validate-function-params-use-object-destructuring-transformer.ts:26 (params): `if (!node.params || node.params.length === 0) {`

## packages/local-eslint/src/guards/is-membership-test-usage/is-membership-test-usage-guard.test.ts

Production file: `packages/local-eslint/src/guards/is-membership-test-usage/is-membership-test-usage-guard.ts`

- **delete** line 16, `EMPTY: {node: ArrayExpression with no parent} => returns false` — missing/wrong: parent (roots 19; parent-null)
  - dead branch candidate is-membership-test-usage-guard.ts:28 (parent): `if (parent === null) {`
  - dead branch candidate is-membership-test-usage-guard.ts:32 (parent): `if (parent.type === 'MemberExpression') {`
  - dead branch candidate is-membership-test-usage-guard.ts:34 (parent): `parent.property?.type === 'Identifier'`
  - dead branch candidate is-membership-test-usage-guard.ts:36 (parent): `: String(parent.property?.value);`
  - dead branch candidate is-membership-test-usage-guard.ts:47 (parent): `if (parent.type === 'NewExpression') {`
  - dead branch candidate is-membership-test-usage-guard.ts:48 (parent): `const calleeName = parent.callee?.type === 'Identifier' ? String(parent.callee.name) : '';`

## packages/local-eslint/src/guards/is-package-name-comparison-operand/is-package-name-comparison-operand-guard.test.ts

Production file: `packages/local-eslint/src/guards/is-package-name-comparison-operand/is-package-name-comparison-operand-guard.ts`

- **delete** line 14, `EMPTY: {node: Literal with no parent} => returns false` — missing/wrong: parent (roots 17; parent-null)
  - dead branch candidate is-package-name-comparison-operand-guard.ts:18 (parent): `const parent = node?.parent;`
  - dead branch candidate is-package-name-comparison-operand-guard.ts:20 (parent): `if (parent === null || parent === undefined) {`
  - dead branch candidate is-package-name-comparison-operand-guard.ts:24 (parent): `if (parent.type === 'SwitchCase') {`
  - dead branch candidate is-package-name-comparison-operand-guard.ts:30 (parent): `if (parent.type !== 'BinaryExpression') {`

## packages/local-eslint/src/transformers/effective-expression-parent/effective-expression-parent-transformer.test.ts

Production file: `packages/local-eslint/src/transformers/effective-expression-parent/effective-expression-parent-transformer.ts`

- **delete** line 16, `EMPTY: {node with parent: null} => returns null` — missing/wrong: parent (roots 19; parent-null)
  - dead branch candidate effective-expression-parent-transformer.ts:23 (parent): `const parent = node?.parent;`
  - dead branch candidate effective-expression-parent-transformer.ts:25 (parent): `if (parent === null || parent === undefined) {`

