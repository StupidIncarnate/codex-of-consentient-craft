# SD1 hand queue

Type errors: 39. Unprintable stub trees: 59. Malformed trees (deletion list, not here): 75. Dead conditions left: {"eslint-plugin":{"nullish-compare":4,"not-truthy":2},"local-eslint":{"nullish-compare":3}}.

## packages/eslint-plugin/src/brokers/rule/ban-jest-mock-in-proxies/rule-ban-jest-mock-in-proxies-broker.ts
- line 75 TS2322: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `ancestor = ancestor.parent;`

## packages/eslint-plugin/src/brokers/rule/ban-playwright-extract-then-assert/rule-ban-playwright-extract-then-assert-broker.ts
- line 63 TS2339: field read on a union the guard pass could not narrow safely (its edit raised the file's errors): narrow by hand. `const methodName = (node.init && 'argument' in node.init ? ((node.init.argument?.type === AST_NODE_TYPES.CallExpression `

## packages/eslint-plugin/src/brokers/rule/ban-primitives/check-primitive-violation-layer-broker.test.ts
- stub tree at line 139 (parent-chain-differs): `TsestreeStub({ type: 'ObjectPattern', parent: assignmentPatternNode, })`
- stub tree at line 144 (printed-code-does-not-parse): `TsestreeStub({ type: 'TSTypeAnnotation', parent: objectPatternNode, })`
- stub tree at line 149 (printed-code-does-not-parse): `TsestreeStub({ type: 'TSStringKeyword', parent: annotationNode, })`
- stub tree at line 185 (parent-chain-differs): `TsestreeStub({ type: 'Identifier', parent: assignmentPatternNode, })`
- stub tree at line 190 (printed-code-does-not-parse): `TsestreeStub({ type: 'TSTypeAnnotation', parent: identifierNode, })`
- stub tree at line 195 (printed-code-does-not-parse): `TsestreeStub({ type: 'TSStringKeyword', parent: annotationNode, })`

## packages/eslint-plugin/src/brokers/rule/ban-tautological-assertions/rule-ban-tautological-assertions-broker.ts
- line 63 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const expectArg = expectCall.arguments?.[0];`

## packages/eslint-plugin/src/brokers/rule/ban-unanchored-to-match/rule-ban-unanchored-to-match-broker.ts
- line 67 TS2339: field read on a union the guard pass could not narrow safely (its edit raised the file's errors): narrow by hand. `const regexPattern = (firstArg.type === AST_NODE_TYPES.Literal ? firstArg.regex?.pattern : undefined);`
- line 104 TS2339: field read on a union the guard pass could not narrow safely (its edit raised the file's errors): narrow by hand. `const regexPattern = (firstArg.type === AST_NODE_TYPES.Literal ? firstArg.regex?.pattern : undefined);`

## packages/eslint-plugin/src/brokers/rule/ban-unknown-payload-in-discriminated-union/check-resolve-schema-binding-layer-broker.test.ts
- stub tree at line 28 (parent-chain-differs): `TsestreeStub({ type: TsestreeNodeType.Identifier, name: IdentifierStub({ value: 'genericPayloadSchema' }), parent: program, })`
- stub tree at line 64 (parent-chain-differs): `TsestreeStub({ type: TsestreeNodeType.Identifier, name: IdentifierStub({ value: 'exportedSchema' }), parent: program, })`
- stub tree at line 82 (parent-chain-differs): `TsestreeStub({ type: TsestreeNodeType.Identifier, name: IdentifierStub({ value: 'unknownName' }), parent: program, })`

## packages/eslint-plugin/src/brokers/rule/bin-program-spawn-ban/resolve-imported-statics-layer-broker.ts
- line 34 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const source = statement.source?.value;`

## packages/eslint-plugin/src/brokers/rule/bin-program-spawn-ban/resolve-spawned-program-layer-broker.test.ts
- stub tree at line 29 (template-shape): `TsestreeStub({ type: TsestreeNodeType.TemplateLiteral, quasis: [ TsestreeStub({ type: TsestreeNodeType.TemplateElement, value: { r`

## packages/eslint-plugin/src/brokers/rule/bin-program-spawn-ban/resolve-static-string-layer-broker.test.ts
- stub tree at line 25 (template-shape): `TsestreeStub({ type: TsestreeNodeType.TemplateLiteral, quasis: [ TsestreeStub({ type: TsestreeNodeType.TemplateElement, value: { r`
- stub tree at line 41 (template-shape): `TsestreeStub({ type: TsestreeNodeType.TemplateLiteral, quasis: [ TsestreeStub({ type: TsestreeNodeType.TemplateElement, value: { r`

## packages/eslint-plugin/src/brokers/rule/enforce-contract-usage-in-tests/rule-enforce-contract-usage-in-tests-broker.ts
- line 84 TS2339: field read on a union the guard pass could not narrow safely (its edit raised the file's errors): narrow by hand. `const importedName = spec.imported?.name ?? '';`

## packages/eslint-plugin/src/brokers/rule/enforce-folder-return-types/check-folder-return-type-layer-broker.ts
- line 40 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const { returnType } = node;`

## packages/eslint-plugin/src/brokers/rule/enforce-gateway-schema-fields/rule-enforce-gateway-schema-fields-broker.ts
- line 143 TS2322: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `({ parent } = current);`

## packages/eslint-plugin/src/brokers/rule/enforce-harness-patterns/validate-harness-constructor-side-effects-layer-broker.ts
- line 23 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const { body } = functionNode;`

## packages/eslint-plugin/src/brokers/rule/enforce-import-dependencies/validate-external-import-layer-broker.ts
- line 82 TS2339: field read on a union the guard pass could not narrow safely (its edit raised the file's errors): narrow by hand. `const name = specifier.imported?.name;`
- line 146 TS2339: field read on a union the guard pass could not narrow safely (its edit raised the file's errors): narrow by hand. `const importedName = specifier.imported?.name;`

## packages/eslint-plugin/src/brokers/rule/enforce-jest-mocked-usage/rule-enforce-jest-mocked-usage-broker.ts
- line 124 TS2532: read the diagnostic. `if ((node.init.type === AST_NODE_TYPES.CallExpression || node.init.type === AST_NODE_TYPES.NewExpression) && ((node.init`

## packages/eslint-plugin/src/brokers/rule/enforce-project-structure/collect-exports-layer-broker.test.ts
- stub tree at line 131 (printed-code-does-not-parse): `TsestreeStub({ type: TsestreeNodeType.Program, body: [ TsestreeStub({ type: TsestreeNodeType.ExportNamedDeclaration, exportKind: '`
- stub tree at line 262 (printed-code-does-not-parse): `TsestreeStub({ type: TsestreeNodeType.Program, body: [ TsestreeStub({ type: TsestreeNodeType.ExportNamedDeclaration, exportKind: '`

## packages/eslint-plugin/src/brokers/rule/enforce-project-structure/collect-exports-layer-broker.ts
- line 26 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const { body } = node;`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-param-binding/check-unbound-type-properties-layer-broker.test.ts
- stub tree at line 217 (printed-code-does-not-parse): `TsestreeStub({ type: TsestreeNodeType.AssignmentPattern, left: objectPattern, })`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-param-binding/check-unbound-type-properties-layer-broker.ts
- line 41 TS2339: field read on a union the guard pass could not narrow safely (its edit raised the file's errors): narrow by hand. `.map((property) => String(property.key?.name)),`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker.ts
- line 212 TS18048: read the diagnostic. `(suffix) => argName.endsWith(suffix),`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-adapter-mock-setup-layer-broker.ts
- line 22 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const { body } = functionNode;`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-no-exposed-child-proxies-layer-broker.ts
- line 23 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const { properties } = objectNode;`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-object-expression-layer-broker.ts
- line 22 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const { properties } = objectNode;`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-proxy-constructor-side-effects-layer-broker.ts
- line 22 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const { body } = functionNode;`

## packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-proxy-function-return-layer-broker.test.ts
- stub tree at line 82 (type-not-node): `TsestreeStub({ type: TsestreeNodeType.ArrowFunctionExpression, returnType: TsestreeStub({ type: TsestreeNodeType.TSTypeAnnotation,`

## packages/eslint-plugin/src/brokers/rule/enforce-stub-patterns/rule-enforce-stub-patterns-broker.ts
- line 67 TS2322: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `({ parent } = parent);`

## packages/eslint-plugin/src/brokers/rule/gateway-colocation/barrel-named-reexports-layer-broker.ts
- line 23 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const statements = Array.isArray(('body' in node ? node.body : undefined)) ? node.body : [];`

## packages/eslint-plugin/src/brokers/rule/jest-mocked-must-import/rule-jest-mocked-must-import-broker.ts
- line 57 TS2345: a name brand on a local Map or Set: retype to string. `importedNames.set(name, source);`
- line 73 TS2345: a name brand on a local Map or Set: retype to string. `if (!importedNames.has(argumentName)) {`
- line 108 TS2345: a name brand on a local Map or Set: retype to string. `const importSource = importedNames.get(argumentName);`

## packages/eslint-plugin/src/brokers/rule/platform-globals-ban/enclosing-function-binding-names-layer-broker.test.ts
- stub tree at line 31 (parent-same-type-in-chain): `TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'document', parent: TsestreeStub({ type: TsestreeNodeType.FunctionDeclarat`

## packages/eslint-plugin/src/brokers/rule/platform-globals-ban/is-page-callback-call-layer-broker.test.ts
- stub tree at line 12 (expr:Identifier): `TsestreeStub({ type: TsestreeNodeType.CallExpression, callee: TsestreeStub({ type: TsestreeNodeType.MemberExpression, computed: fa`

## packages/eslint-plugin/src/brokers/rule/platform-globals-ban/is-type-position-layer-broker.test.ts
- stub tree at line 9 (parent-chain-differs): `TsestreeStub({ parent: TsestreeStub({ type: TsestreeNodeType.TSTypeReference }), })`
- stub tree at line 20 (parent-no-slot:TSQualifiedName): `TsestreeStub({ parent: TsestreeStub({ type: TsestreeNodeType.TSQualifiedName }), })`

## packages/eslint-plugin/src/brokers/rule/require-contract-validation/rule-require-contract-validation-broker.ts
- line 85 TS2339: field read on a union the guard pass could not narrow safely (its edit raised the file's errors): narrow by hand. `const objectName = ((arg.type === AST_NODE_TYPES.CallExpression || arg.type === AST_NODE_TYPES.NewExpression) ? arg.call`
- line 137 TS2339: field read on a union the guard pass could not narrow safely (its edit raised the file's errors): narrow by hand. `const objectName = ((source.type === AST_NODE_TYPES.CallExpression || source.type === AST_NODE_TYPES.NewExpression) ? so`

## packages/eslint-plugin/src/brokers/rule/require-validation-on-untyped-property-access/check-binding-initializer-layer-broker.test.ts
- stub tree at line 24 (parent-chain-differs): `TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'parsed', parent: block, })`
- stub tree at line 42 (parent-chain-differs): `TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'unknownName', parent: block, })`

## packages/eslint-plugin/src/contracts/tsestree/tsestree-contract.test.ts
- stub tree at line 29 (parent-chain-differs): `TsestreeStub({ type: TsestreeNodeType.Identifier, parent, })`
- stub tree at line 40 (type-not-literal): `TsestreeStub({ type: '' as unknown as typeof TsestreeNodeType.Identifier, })`
- stub tree at line 48 (type-not-literal): `TsestreeStub({ type: 'InvalidNodeType' as unknown as typeof TsestreeNodeType.Identifier, })`

## packages/eslint-plugin/src/guards/is-ast-brand-in-chain/is-ast-brand-in-chain-guard.test.ts
- stub tree at line 33 (parent-same-type-in-chain): `TsestreeStub({ type: 'MemberExpression', parent: brandMember, })`
- stub tree at line 38 (parent-same-type-in-chain): `TsestreeStub({ type: 'CallExpression', parent: emailMember, })`
- stub tree at line 74 (parent-same-type-in-chain): `TsestreeStub({ type: 'MemberExpression', parent: brandMember, })`
- stub tree at line 79 (parent-same-type-in-chain): `TsestreeStub({ type: 'MemberExpression', parent: emailMember, })`
- stub tree at line 84 (parent-same-type-in-chain): `TsestreeStub({ type: 'MemberExpression', parent: maxMember, })`
- stub tree at line 89 (parent-same-type-in-chain): `TsestreeStub({ type: 'CallExpression', parent: minMember, })`
- stub tree at line 119 (parent-same-type-in-chain): `TsestreeStub({ type: 'CallExpression', parent: emailCall, })`
- stub tree at line 139 (parent-same-type-in-chain): `TsestreeStub({ type: 'CallExpression', parent: optionalCall, })`
- stub tree at line 153 (parent-same-type-in-chain): `TsestreeStub({ type: 'CallExpression', parent: parentNode, })`

## packages/eslint-plugin/src/guards/is-ast-callback-function/is-ast-callback-function-guard.test.ts
- stub tree at line 36 (printed-code-has-no-FunctionDeclaration): `TsestreeStub({ type: 'FunctionDeclaration', parent: callExpression, })`
- stub tree at line 49 (parent-chain-differs): `TsestreeStub({ type: 'ArrowFunctionExpression', parent: blockStatement, })`

## packages/eslint-plugin/src/guards/is-ast-function-params-destructured/is-ast-function-params-destructured-guard.ts
- line 31 TS2322: a value the real type widens: read and retype the receiving variable. `) : undefined);`

## packages/eslint-plugin/src/guards/is-ast-method-call/is-ast-method-call-guard.test.ts
- stub tree at line 122 (printed-code-does-not-parse): `TsestreeStub({ type: 'CallExpression', callee: TsestreeStub({ type: 'MemberExpression', object: TsestreeStub({ type: 'Identifier',`

## packages/eslint-plugin/src/guards/is-ast-node-inside-function/is-ast-node-inside-function-guard.test.ts
- stub tree at line 6 (parent-chain-differs): `TsestreeStub({ type: 'Identifier', parent: TsestreeStub({ type: 'ArrowFunctionExpression', }), })`
- stub tree at line 17 (parent-chain-differs): `TsestreeStub({ type: 'Identifier', parent: TsestreeStub({ type: 'FunctionExpression', }), })`
- stub tree at line 39 (printed-code-does-not-parse): `TsestreeStub({ type: 'Identifier', parent: TsestreeStub({ type: 'VariableDeclarator', parent: TsestreeStub({ type: 'VariableDeclar`
- stub tree at line 56 (parent-chain-differs): `TsestreeStub({ type: 'Identifier', parent: TsestreeStub({ type: 'Program', }), })`

## packages/eslint-plugin/src/guards/is-ast-param-stub-argument-type/is-ast-param-stub-argument-type-guard.test.ts
- stub tree at line 55 (roundtrip-mismatch): `TsestreeStub({ type: 'ArrowFunctionExpression', params: [ TsestreeStub({ type: 'AssignmentPattern', typeAnnotation: TsestreeStub({`

## packages/eslint-plugin/src/guards/is-ast-param-stub-argument-type/is-ast-param-stub-argument-type-guard.ts
- line 25 TS2339: field read on a union the guard pass could not narrow safely (its edit raised the file's errors): narrow by hand. `const typeAnnotation = ('typeAnnotation' in firstParam ? firstParam.typeAnnotation : undefined) ?? ((firstParam.type ===`

## packages/eslint-plugin/src/guards/is-partial-override-block/is-partial-override-block-guard.test.ts
- stub tree at line 80 (roundtrip-mismatch): `TsestreeStub({ type: TsestreeNodeType.TSTypeLiteral, members: [ TsestreeStub({ type: TsestreeNodeType.TSPropertySignature, optiona`

## packages/eslint-plugin/src/guards/is-partial-override-block/is-partial-override-block-guard.ts
- line 31 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const blockBody = Array.isArray(block.body) ? block.body : undefined;`
- line 31 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const blockBody = Array.isArray(block.body) ? block.body : undefined;`
- line 32 TS2339: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `const members = block.members ?? blockBody;`
- line 41 TS7006: read the diagnostic. `(member) =>`

## packages/eslint-plugin/src/transformers/ast-callee-root-name/ast-callee-root-name-transformer.ts
- line 17 TS2339: field read on a union the guard pass could not narrow safely (its edit raised the file's errors): narrow by hand. `const { callee } = node ?? {};`

## packages/eslint-plugin/src/transformers/ast-function-type/ast-function-type-transformer.test.ts
- stub tree at line 77 (printed-code-does-not-parse): `TsestreeStub({ parent })`

## packages/eslint-plugin/src/transformers/ast-get-imports/ast-get-imports-transformer.test.ts
- stub tree at line 161 (printed-code-does-not-parse): `TsestreeStub({ type: TsestreeNodeType.ImportDeclaration, source: TsestreeStub({ type: TsestreeNodeType.Literal, value: 123 }), spe`

## packages/eslint-plugin/src/transformers/ast-get-member-expression-root/ast-get-member-expression-root-transformer.test.ts
- stub tree at line 122 (printed-code-does-not-parse): `TsestreeStub({ type: TsestreeNodeType.MemberExpression, object: TsestreeStub({ type: TsestreeNodeType.Literal, value: 123, }), pro`

## packages/eslint-plugin/src/transformers/type-name-from-annotation/type-name-from-annotation-transformer.test.ts
- stub tree at line 38 (type-not-node): `TsestreeStub({ type: 'TSArrayType', typeAnnotation: TsestreeStub({ type: 'TSTypeReference', typeName: TsestreeStub({ type: 'Identi`

## packages/eslint-plugin/src/transformers/validate-function-params-use-object-destructuring/validate-function-params-use-object-destructuring-transformer.test.ts
- stub tree at line 54 (printed-code-does-not-parse): `TsestreeStub({ type: TsestreeNodeType.AssignmentPattern, left: TsestreeStub({ type: TsestreeNodeType.ObjectPattern, }), })`

## packages/local-eslint/src/brokers/rule/ban-quest-status-literals/is-status-member-expression-layer-broker.test.ts
- stub tree at line 65 (expr:Identifier): `TsestreeStub({ type: TsestreeNodeType.MemberExpression, object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: Identifier`
- stub tree at line 88 (expr:Identifier): `TsestreeStub({ type: TsestreeNodeType.MemberExpression, object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: Identifier`

## packages/local-eslint/src/brokers/rule/ban-sync-seeding-methods/rule-ban-sync-seeding-methods-broker.ts
- line 47 TS2352: cast of a union to a record: narrow the node first. `const valueNode = node.value as Record<PropertyKey, unknown>;`
- line 95 TS2352: cast of a union to a record: narrow the node first. `const valueNode = node.value as Record<PropertyKey, unknown>;`

## packages/local-eslint/src/brokers/rule/no-hardcoded-package-names/rule-no-hardcoded-package-names-broker.ts
- line 111 TS2677: a value the real type widens: read and retype the receiving variable. `const roleElements = (node.elements).filter((element): element is TSESTree.Node => {`
- line 127 TS2345: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `membershipTestedElements.push(...roleElements);`
- line 137 TS2345: helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it. `roleElementsByBindingName.set(bindingName, [`

## packages/local-eslint/src/guards/is-classified-status-literal-element/is-classified-status-literal-element-guard.test.ts
- stub tree at line 41 (shorthand-var): `TsestreeStub({ type: TsestreeNodeType.Literal, value })`

## packages/local-eslint/src/guards/is-membership-test-usage/is-membership-test-usage-guard.test.ts
- stub tree at line 31 (expr:Identifier): `TsestreeStub({ type: TsestreeNodeType.ArrayExpression, parent: { type: TsestreeNodeType.MemberExpression, property: { type: Tsestr`
- stub tree at line 61 (printed-code-does-not-parse): `TsestreeStub({ type: TsestreeNodeType.ArrayExpression, parent: { type: TsestreeNodeType.MemberExpression, property: { type: Tsestr`
- stub tree at line 120 (expr:Identifier): `TsestreeStub({ type: TsestreeNodeType.ArrayExpression, parent: { type: TsestreeNodeType.MemberExpression, property: { type: Tsestr`
- stub tree at line 182 (printed-code-does-not-parse): `TsestreeStub({ type: TsestreeNodeType.ArrayExpression, parent: { type: TsestreeNodeType.TSAsExpression, parent: { type: TsestreeNo`

## packages/local-eslint/src/guards/is-package-name-comparison-operand/is-package-name-comparison-operand-guard.test.ts
- stub tree at line 29 (shorthand-var): `TsestreeStub({ type: TsestreeNodeType.Literal, value: 'web', parent: { type: TsestreeNodeType.BinaryExpression, operator }, })`
- stub tree at line 42 (no-printer:SwitchCase): `TsestreeStub({ type: TsestreeNodeType.Literal, value: 'server', parent: { type: TsestreeNodeType.SwitchCase }, })`

## packages/local-eslint/src/transformers/effective-expression-parent/effective-expression-parent-transformer.test.ts
- stub tree at line 43 (expr:Identifier): `TsestreeStub({ type: TsestreeNodeType.ArrayExpression, parent: { type: wrapperType, parent: { type: TsestreeNodeType.VariableDecla`
- stub tree at line 58 (no-root-wrapper:TSNonNullExpression): `TsestreeStub({ type: TsestreeNodeType.ArrayExpression, parent: { type: TsestreeNodeType.TSAsExpression, parent: { type: TsestreeNo`
