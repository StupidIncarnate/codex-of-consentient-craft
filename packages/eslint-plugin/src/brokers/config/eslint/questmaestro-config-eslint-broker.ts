import type { EslintConfig } from '../../../contracts/eslint-config/eslint-config-contract';

export const questmaestroConfigEslintBroker = (): EslintConfig => ({
  plugins: {
    // ESLint core rules (no plugin needed)
  },
  rules: {
    // ✅ { get foo() {}, set foo(val) {} }
    // ❌ { get foo() {} }
    // Enforces getter/setter pairs to prevent incomplete property access
    'accessor-pairs': 'error',

    // ✅ [1,2,3].map(x => x * 2)
    // ❌ [1,2,3].map(x => { x * 2 })
    // Ensures array methods return values to prevent undefined results
    'array-callback-return': 'error',

    // ✅ x => ({ foo: x })
    // ❌ x => { return { foo: x } }
    // Enforces concise arrow function bodies when possible
    'arrow-body-style': ['error', 'always'],

    // ✅ for (let i = 0; i < 10; i++) { const x = i }
    // ❌ for (var i = 0; i < 10; i++) { } console.log(i)
    // Enforces use of variables within the scope they are defined
    'block-scoped-var': 'error',

    // ✅ userName = true
    // ❌ user_name = true
    // Enforces camelCase naming for variables and functions
    camelcase: 'error',

    // ✅ 'UPPER_CASE'
    // ❌ 'Upper_Case'
    // Enforces consistent case in literals and template strings
    'capitalized-comments': 'error',

    // ✅ class Foo { method() { this.bar } }
    // ❌ class Foo { method() { return 5 } }
    // Ensures class methods use 'this' or are static
    'class-methods-use-this': 'error',

    // ✅ if (x < 5) { }
    // ❌ if (x < 5 && y < 10 && z < 15 && a < 20) { }
    // Limits cyclomatic complexity to prevent overly complex functions
    complexity: ['error', { max: 10 }],

    // ✅ function foo() { return x }
    // ❌ function foo() { if (x) return x }
    // Enforces consistent return statement usage
    'consistent-return': 'error',

    // ✅ const self = this; callback(function() { self.method() })
    // ❌ const that = this; const me = this;
    // Enforces consistent naming when capturing the current execution context
    'consistent-this': 'error',

    // ✅ this.callSuper()
    // ❌ callSuper()
    // Enforces consistent 'this' usage in derived constructors
    'constructor-super': 'error',

    // ✅ if (condition) { statement }
    // ❌ if (condition) statement
    // Enforces braces around control statements
    curly: 'error',

    // ✅ switch (x) { default: break }
    // ❌ switch (x) { case 1: break }
    // Requires default case in switch statements
    'default-case': 'error',

    // ✅ switch (x) { default: break; case 1: }
    // ❌ switch (x) { case 1: default: }
    // Enforces default case as last case in switch
    'default-case-last': 'error',

    // ✅ a?.b?.c
    // ❌ a && a.b && a.b.c
    // Enforces optional chaining over logical AND chains
    'default-param-last': 'error',

    // ✅ obj.property
    // ❌ obj['property']
    // Enforces dot notation when possible
    'dot-notation': 'error',

    // ✅ x === y
    // ❌ x == y
    // Requires strict equality operators
    eqeqeq: 'error',

    // ✅ for (let i = 0; i < 10; i++)
    // ❌ for (let i = 0; i < 10; i--)
    // Ensures for-loop counters move in correct direction
    'for-direction': 'error',

    // ✅ function* gen() { yield x; return y }
    // ❌ function* gen() { yield x }
    // Enforces return in generator functions
    'func-name-matching': 'error',

    // ✅ const fn = function namedFn() {}
    // ❌ const fn = function() {}
    // Requires named function expressions
    'func-names': 'error',

    // ✅ function declaration() {}
    // ❌ const expression = function() {}
    // Enforces function declarations over expressions
    'func-style': ['error', 'expression', { allowArrowFunctions: false }],

    // ✅ get value() { return this._value }
    // ❌ get value() { console.log('getting') }
    // Enforces return statements in getters
    'getter-return': 'error',

    // ✅ for (key in obj) { if (obj.hasOwnProperty(key)) { obj[key] } }
    // ❌ for (key in obj) { obj[key] }
    // Requires proper for-in loop filtering
    'guard-for-in': 'error',

    // ✅ { get x() {}, set x(v) {} }
    // ❌ { get x() {}, foo: 1, set x(v) {} }
    // Requires grouped accessor pairs in object literals and classes
    'grouped-accessor-pairs': 'error',

    // ✅ const allowedName = 'value'
    // ❌ const data = 'value' (if 'data' is in denylist)
    // Disallows specified identifier names
    'id-denylist': 'off',

    // ✅ const userName = 'john'
    // ❌ const x = 'john'
    // Enforces minimum identifier length
    'id-length': ['error', { min: 2 }],

    // ✅ const validName = 'test' (matches configured pattern)
    // ❌ const invalid_name = 'test' (doesn't match pattern)
    // Enforces identifier naming pattern with regex
    'id-match': 'error',

    // ✅ const result = init(); if (result) return result
    // ❌ if (init()) return init()
    // Prevents redundant function calls by requiring initialization
    'init-declarations': 'error',

    // ✅ x ||= defaultValue
    // ❌ x = x || defaultValue
    // Requires or disallows logical assignment operator shorthand
    'logical-assignment-operators': 'error',

    // ✅ class A {} class B {}
    // ❌ class A {} class B {} class C {} class D {}
    // Enforces maximum number of classes per file
    'max-classes-per-file': ['error', { max: 1 }],

    // ✅ if (a) { if (b) { } }
    // ❌ if (a) { if (b) { if (c) { if (d) { } } } }
    // Enforces maximum depth that blocks can be nested
    'max-depth': ['error', { max: 4 }],

    // ✅ function small() { return x }
    // ❌ function huge() { /* 100 lines */ }
    // Limits function length to maintain readability
    'max-lines-per-function': ['error', { max: 50 }],

    // ✅ file with 500 lines
    // ❌ file with 2000 lines
    // Limits file length to encourage modularity
    'max-lines': ['error', { max: 1000 }],

    // ✅ if (a && b)
    // ❌ if (a && b && c && d && e && f && g)
    // Limits nested callbacks to prevent callback hell
    'max-nested-callbacks': ['error', { max: 4 }],

    // ✅ function fn(a, b, c) ❌ function fn(a, b, c, d, e, f, g)
    // Limits parameter count to encourage object parameters
    'max-params': ['error', { max: 1 }],

    // ✅ const { a, b } = obj
    // ❌ const a = obj.a; const b = obj.b; const c = obj.c;
    // Limits variable declarations per scope
    'max-statements': ['error', { max: 20 }],

    // ✅ obj.method()
    // ❌ new Date.getTime()
    // Requires 'new' operator when calling constructor
    'new-cap': 'error',

    // ✅ console.log('debug')
    // ❌ alert('message')
    // Disallows use of alert, confirm, and prompt
    'no-alert': 'error',

    // ✅ const arr = [1, 2, 3]
    // ❌ const arr = new Array(1, 2, 3)
    // Disallows Array constructors
    'no-array-constructor': 'error',

    // ✅ const x = 1 << 2
    // ❌ const x = 1 & 2
    // Disallows bitwise operators
    'no-bitwise': 'error',

    // ✅ async function() { return await promise }
    // ❌ new Promise(async (resolve) => {})
    // Disallows async function as Promise executor
    'no-async-promise-executor': 'error',

    // ✅ for (const item of items) { await process(item) }
    // ❌ for (const item of items) { await process(item) }
    // Disallows await inside loops (use Promise.all instead)
    'no-await-in-loop': 'error',

    // ✅ function fn() { return arguments[0] }
    // ❌ function fn() { return arguments.caller }
    // Disallows the use of arguments.caller or arguments.callee
    'no-caller': 'error',

    // ✅ switch (x) { case 1: { const a = 1; break; } }
    // ❌ switch (x) { case 1: const a = 1; break; }
    // Disallows lexical declarations in case clauses
    'no-case-declarations': 'error',

    // ✅ let x = 1; x = 2;
    // ❌ const x = 1; x = 2;
    // Prevents reassignment of class declarations
    'no-class-assign': 'error',

    // ✅ if (x === 0)
    // ❌ if (x === -0)
    // Disallows comparing against negative zero
    'no-compare-neg-zero': 'error',

    // ✅ process.stdout.write('output')
    // ❌ console.log('debug')
    // Disallows the use of console
    'no-console': 'error',

    // ✅ for (let i = 0; i < 10; i++) { if (condition) break }
    // ❌ for (let i = 0; i < 10; i++) { if (condition) continue }
    // Disallows continue statements
    'no-continue': 'error',

    // ✅ if ((x = y) !== null)
    // ❌ if (x = y)
    // Disallows assignment operators in conditional expressions
    'no-cond-assign': 'error',

    // ✅ const x = 1
    // ❌ const x = 1; x = 2;
    // Disallows reassigning const variables
    'no-const-assign': 'error',

    // ✅ const x = y || z
    // ❌ const x = false && y
    // Disallows expressions where operation doesn't affect the value
    'no-constant-binary-expression': 'error',

    // ✅ if (condition) {}
    // ❌ if (true) {}
    // Disallows constant expressions in conditions
    'no-constant-condition': 'error',

    // ✅ class A { constructor() { this.x = 1 } }
    // ❌ class A { constructor() { return {} } }
    // Disallows returning value from constructor
    'no-constructor-return': 'error',

    // ✅ const x = /[a-z]/
    // ❌ const x = /[\x00-\x1f]/
    // Disallows control characters in regular expressions
    'no-control-regex': 'error',

    // ✅ console.log('debug info')
    // ❌ console.log('debug'); debugger;
    // Disallows debugger statements in production
    'no-debugger': 'error',

    // ✅ delete obj.prop
    // ❌ delete obj
    // Disallows deleting variables (only properties)
    'no-delete-var': 'error',

    // ✅ const regex = /abc/
    // ❌ const regex = /=abc/
    // Disallows equal signs explicitly at the beginning of regular expressions
    'no-div-regex': 'error',

    // ✅ function foo(a, b) {}
    // ❌ function foo(a, a) {}
    // Disallows duplicate function parameter names
    'no-dupe-args': 'error',

    // ✅ class A { foo() {} bar() {} }
    // ❌ class A { foo() {} foo() {} }
    // Disallows duplicate class members
    'no-dupe-class-members': 'error',

    // ✅ if (a) {} else if (b) {}
    // ❌ if (a) {} else if (a) {}
    // Disallows duplicate conditions in if-else-if chains
    'no-dupe-else-if': 'error',

    // ✅ { a: 1, b: 2 }
    // ❌ { a: 1, a: 2 }
    // Disallows duplicate keys in object literals
    'no-dupe-keys': 'error',

    // ✅ switch (x) { case 1: case 2: }
    // ❌ switch (x) { case 1: case 1: }
    // Disallows duplicate case labels
    'no-duplicate-case': 'error',

    // ✅ import a from 'mod'; import b from 'mod2';
    // ❌ import a from 'mod'; import b from 'mod';
    // Disallows duplicate module imports
    'no-duplicate-imports': 'error',

    // ✅ if (condition) { return value } return null
    // ❌ if (condition) { return value } else { return null }
    // Disallows else blocks after return statements in if statements
    'no-else-return': 'error',

    // ✅ if (condition) { doSomething() }
    // ❌ if (condition) { }
    // Disallows empty statements
    'no-empty': 'error',

    // ✅ /[a-z]/
    // ❌ /[]/
    // Disallows empty character classes in regular expressions
    'no-empty-character-class': 'error',

    // ✅ function fn({a, b}) {}
    // ❌ function fn({}) {}
    // Disallows empty destructuring patterns
    'no-empty-pattern': 'error',

    // ✅ class Foo { static { this.init() } }
    // ❌ class Foo { static { } }
    // Disallows empty static blocks
    'no-empty-static-block': 'error',

    // ✅ function process() { return value }
    // ❌ function process() {}
    // Disallows empty functions
    'no-empty-function': 'error',

    // ✅ x == null
    // ❌ x == undefined
    // Disallows null comparisons without type-checking operators
    'no-eq-null': 'error',

    // ✅ parseInt('077', 10)
    // ❌ eval('code')
    // Disallows use of eval()
    'no-eval': 'error',

    // ✅ try {} catch (e) { handle(e) }
    // ❌ try {} catch (e) { e = new Error() }
    // Disallows reassigning exceptions in catch clauses
    'no-ex-assign': 'error',

    // ✅ MyClass.prototype.customMethod = function() {}
    // ❌ Number.prototype.toFixed = function() {}
    // Disallows extending native types
    'no-extend-native': 'error',

    // ✅ fn.call(this, arg)
    // ❌ fn.call(this, arg).call(this, arg)
    // Disallows unnecessary function binding
    'no-extra-bind': 'error',

    // ✅ if (value) {}
    // ❌ if (Boolean(value)) {}
    // Disallows unnecessary boolean casts
    'no-extra-boolean-cast': 'error',

    // ✅ label: while (condition) { break label }
    // ❌ label: while (condition) { break; break label }
    // Disallows unnecessary labels
    'no-extra-label': 'error',

    // ✅ switch (x) { case 1: break; }
    // ❌ switch (x) { case 1: // falls through }
    // Disallows fallthrough of case statements
    'no-fallthrough': 'error',

    // ✅ function fn() {}
    // ❌ function fn() {} fn = null;
    // Disallows reassigning function declarations
    'no-func-assign': 'error',

    // ✅ const window = customWindow
    // ❌ window = {}
    // Disallows assignments to global variables
    'no-global-assign': 'error',

    // ✅ (function() { var x = 1 })()
    // ❌ var globalVar = 1
    // Disallows declarations in the global scope
    'no-implicit-globals': 'error',

    // ✅ parseInt(str, 10)
    // ❌ parseInt(str)
    // Disallows shorthand type conversions
    'no-implicit-coercion': 'error',

    // ✅ setTimeout(function() { code }, 100)
    // ❌ setTimeout('code', 100)
    // Disallows the use of eval()-like methods
    'no-implied-eval': 'error',

    // ✅ const x = 1;\n// This is a comment
    // ❌ const x = 1; // inline comment
    // Disallows inline comments after code
    'no-inline-comments': 'error',

    // ✅ import fs from 'fs'; const copy = fs;
    // ❌ import fs from 'fs'; fs = null;
    // Disallows assigning to imported bindings
    'no-import-assign': 'error',

    // ✅ var x; function fn() {}
    // ❌ { var x; function fn() {} }
    // Disallows variable and function declarations in nested blocks
    'no-inner-declarations': 'error',

    // ✅ new RegExp('valid')
    // ❌ new RegExp('[')
    // Disallows invalid regular expression strings
    'no-invalid-regexp': 'error',

    // ✅ 'hello world'
    // ❌ 'hello\u2000world'
    // Disallows irregular whitespace
    'no-irregular-whitespace': 'error',

    // ✅ function method() { return this.value }
    // ❌ function standalone() { return this.value }
    // Disallows use of this in contexts where the value of this is undefined
    'no-invalid-this': 'error',

    // ✅ if (iterator.done) {}
    // ❌ for (const item of iterator) {}
    // Disallows iterator.__iterator__ property
    'no-iterator': 'error',

    // ✅ const name = 'test'; label: for (...)
    // ❌ const label = 'test'; label: for (...)
    // Disallows labels that share a name with a variable
    'no-label-var': 'error',

    // ✅ for (const item of items) { break }
    // ❌ label: for (...) break label;
    // Disallows labeled statements
    'no-labels': 'error',

    // ✅ function fn() { const x = 1 }
    // ❌ function fn() { { const x = 1 } }
    // Disallows unnecessary nested blocks
    'no-lone-blocks': 'error',

    // ✅ if (condition) { doSomething() } else if (other) { doOther() }
    // ❌ if (condition) { doSomething() } else { if (other) { doOther() } }
    // Disallows if statements as the only statement in else blocks
    'no-lonely-if': 'error',

    // ✅ const funcs = items.map(item => () => process(item))
    // ❌ for (const item of items) { funcs.push(() => process(item)) }
    // Disallows function declarations and expressions inside loop statements
    'no-loop-func': 'error',

    // ✅ const x = 9007199254740991
    // ❌ const x = 9007199254740992
    // Disallows literal numbers that lose precision
    'no-loss-of-precision': 'error',

    // ✅ const MAGIC = 7; if (x > MAGIC)
    // ❌ if (x > 7)
    // Disallows magic numbers
    'no-magic-numbers': ['error', { ignore: [0, 1] }],

    // ✅ const a = 1; const b = 2;
    // ❌ const a = b = c = 1
    // Disallows use of chained assignment expressions
    'no-multi-assign': 'error',

    // ✅ const regex = /[👍]/
    // ❌ const regex = /[👨‍👩‍👧‍👦]/
    // Disallows characters made with multiple code points in character class
    'no-misleading-character-class': 'error',

    // ✅ const x = 'line one\nline two'
    // ❌ const x = 'line one\line two'
    // Disallows multiline strings
    'no-multi-str': 'error',

    // ✅ if (isValid)
    // ❌ if (!isInvalid)
    // Disallows negated conditions
    'no-negated-condition': 'error',

    // ✅ let result; if (condition) { result = a } else { result = b }
    // ❌ const result = condition ? (a ? b : c) : d
    // Disallows nested ternary expressions
    'no-nested-ternary': 'error',

    // ✅ const obj = new MyClass()
    // ❌ MyClass()
    // Requires constructor functions to be called with new
    'no-new': 'error',

    // ✅ const fn = Function
    // ❌ const fn = new Function('return 1')
    // Disallows new operators with Function object
    'no-new-func': 'error',

    // ✅ const date = new Date()
    // ❌ const sym = new Symbol()
    // Disallows new operators with global non-constructor functions
    'no-new-native-nonconstructor': 'error',

    // ✅ const sym = Symbol()
    // ❌ const sym = new Symbol()
    // Disallows new operators with Symbol object
    'no-new-wrappers': 'error',

    // ✅ const str = '\\n'
    // ❌ const str = '\8'
    // Disallows \8 and \9 escape sequences in string literals
    'no-nonoctal-decimal-escape': 'error',

    // ✅ const obj = {}
    // ❌ const obj = new Object()
    // Disallows calls to the Object constructor without an argument
    'no-object-constructor': 'error',

    // ✅ Math.max(...args)
    // ❌ Math()
    // Disallows calling some Object.prototype methods directly on objects
    'no-obj-calls': 'error',

    // ✅ parseInt('71', 8)
    // ❌ parseInt('071')
    // Disallows octal literals
    'no-octal': 'error',

    // ✅ const str = '\\251'
    // ❌ const str = '\251'
    // Disallows octal escape sequences in string literals
    'no-octal-escape': 'error',

    // ✅ function fn(opts = {}) {}
    // ❌ function fn(opts) { opts = opts || {} }
    // Disallows reassigning function parameters
    'no-param-reassign': 'error',

    // ✅ i += 1
    // ❌ i++
    // Disallows the unary operators ++ and --
    'no-plusplus': 'error',

    // ✅ const hasOwn = Object.prototype.hasOwnProperty
    // ❌ const proto = obj.__proto__
    // Disallows the use of the __proto__ property
    'no-proto': 'error',

    // ✅ new Promise(resolve => { resolve(value) })
    // ❌ new Promise(resolve => { return value })
    // Disallows returning values from Promise executor functions
    'no-promise-executor-return': 'error',

    // ✅ if (Object.prototype.hasOwnProperty.call(obj, 'key'))
    // ❌ if (obj.hasOwnProperty('key'))
    // Disallows calling some Object.prototype methods directly
    'no-prototype-builtins': 'error',

    // ✅ const x = /[a-z]/gi
    // ❌ const x = /[a-z  ]/gi
    // Disallows multiple spaces in regular expressions
    'no-regex-spaces': 'error',

    // ✅ const x = 1; function fn() { const x = 2 }
    // ❌ const x = 1; const x = 2
    // Disallows variable redeclaration
    'no-redeclare': 'error',

    // ✅ export { default } from 'mod'
    // ❌ export { default as default } from 'mod'
    // Disallows specified names in exports (when configured with restrictedNames)
    // Example config: { restrictedNames: ['default', 'then'] }
    'no-restricted-exports': 'off',

    // ✅ const x = window.localStorage
    // ❌ const x = event
    // Disallows specified global variables (when configured with restricted names)
    // Example config: ['event', 'name', 'length'] to prevent accidental global usage
    'no-restricted-globals': 'off',

    // ✅ const allowed = require('fs')
    // ❌ const denied = require('crypto')
    // Disallows specified modules when loaded by import (when configured with paths/patterns)
    // Example config: { paths: ['lodash'], patterns: ['@internal/*'] }
    'no-restricted-imports': 'off',

    // ✅ const value = obj.allowed
    // ❌ const value = obj.restricted
    // Disallows certain properties on certain objects (when configured with restrictions)
    // Example config: { object: 'document', property: 'write', message: 'Use safer alternatives' }
    'no-restricted-properties': 'off',

    // ✅ for (const key in obj)
    // ❌ for (const key in obj) { delete obj[key] }
    // Disallows certain syntax patterns (when configured with AST selectors)
    // Example config: 'WithStatement', 'BinaryExpression[operator="in"]'
    // Dont do this cause it can easily get overwritten
    // 'no-restricted-syntax': 'off',

    // ✅ function fn() { return value }
    // ❌ function fn() { return x = 1 }
    // Disallows assignment operators in return statements
    'no-return-assign': 'error',

    // ✅ location.href = url
    // ❌ location.href = 'javascript:void(0)'
    // Disallows javascript: urls
    'no-script-url': 'error',

    // ✅ const x = 1; x = 2;
    // ❌ x = x
    // Disallows assignments where both sides are exactly the same
    'no-self-assign': 'error',

    // ✅ if (x !== y)
    // ❌ if (x !== x)
    // Disallows comparisons where both sides are exactly the same
    'no-self-compare': 'error',

    // ✅ const x = 1; const y = 2
    // ❌ const x = (1, 2)
    // Disallows comma operators
    'no-sequences': 'error',

    // ✅ const outer = 1; function fn() { const inner = 2 }
    // ❌ const name = 1; function fn() { const name = 2 }
    // Disallows variable declarations from shadowing variables declared in the outer scope
    'no-shadow': 'error',

    // ✅ set value(val) { this._value = val }
    // ❌ set value(val) { return val }
    // Disallows returning values from setters
    'no-setter-return': 'error',

    // ✅ const obj = { toString() {} }
    // ❌ const obj = { hasOwnProperty() {} }
    // Disallows shadowing of restricted names
    'no-shadow-restricted-names': 'error',

    // ✅ const arr = [1, 2, 3]
    // ❌ const arr = [1, , 3]
    // Disallows sparse arrays
    'no-sparse-arrays': 'error',

    // ✅ const str = `hello ${name}`
    // ❌ const str = 'hello ${name}'
    // Disallows template literal placeholder syntax in regular strings
    'no-template-curly-in-string': 'error',

    // ✅ if (condition) { return true } else { return false }
    // ❌ const result = condition ? true : false
    // Disallows ternary operators
    'no-ternary': 'error',

    // ✅ super(); this.value = 1
    // ❌ this.value = 1; super()
    // Disallows this/super before calling super()
    'no-this-before-super': 'error',

    // ✅ throw new Error('message')
    // ❌ throw 'string'
    // Restricts what can be thrown as an exception
    'no-throw-literal': 'error',

    // ✅ const x = defined
    // ❌ const x = undefined
    // Disallows the use of undeclared variables
    'no-undef': 'error',

    // ✅ let x = null
    // ❌ let x = undefined
    // Disallows initializing variables to undefined
    'no-undef-init': 'error',

    // ✅ const x = null
    // ❌ let x = undefined
    // Disallows the use of undefined as an identifier
    'no-undefined': 'error',

    // ✅ const value = 1
    // ❌ const _value = 1
    // Disallows dangling underscores in identifiers
    'no-underscore-dangle': 'error',

    // ✅ const x = 1\n;[1, 2, 3].forEach(console.log)
    // ❌ const x = 1\n[1, 2, 3].forEach(console.log)
    // Disallows confusing multiline expressions
    'no-unexpected-multiline': 'error',

    // ✅ const result = getValue()
    // ❌ getValue(); x + y;
    // Disallows unused expressions
    'no-unused-expressions': 'error',

    // ✅ label: for (...) { break label }
    // ❌ unused: for (...) {}
    // Disallows unused labels
    'no-unused-labels': 'error',

    // ✅ while (condition) { update() }
    // ❌ while (condition) { }
    // Disallows unmodified loop conditions
    'no-unmodified-loop-condition': 'error',

    // ✅ x ? y : z
    // ❌ condition ? x : x
    // Disallows ternary operators when simpler alternatives exist
    'no-unneeded-ternary': 'error',

    // ✅ return x
    // ❌ return; x = 1
    // Disallows unreachable code after return, throw, continue, and break
    'no-unreachable': 'error',

    // ✅ for (let i = 0; i < 10; i++) { if (condition) break }
    // ❌ for (let i = 0; true; i++) { console.log(i) }
    // Disallows unreachable code after loops
    'no-unreachable-loop': 'error',

    // ✅ try {} catch {}
    // ❌ try {} finally { return }
    // Disallows control flow statements in finally blocks
    'no-unsafe-finally': 'error',

    // ✅ !(obj instanceof Constructor)
    // ❌ !obj instanceof Constructor
    // Disallows negating the left operand of relational operators
    'no-unsafe-negation': 'error',

    // ✅ obj?.prop?.toString()
    // ❌ obj?.prop.toString()
    // Disallows use of optional chaining in contexts where undefined behavior could occur
    'no-unsafe-optional-chaining': 'error',

    // ✅ const x = 1; console.log(x)
    // ❌ const x = 1;
    // Disallows unused variables
    'no-unused-vars': 'error',

    // ✅ class MyClass { #used() { return 1 } method() { return this.#used() } }
    // ❌ class MyClass { #unused() {} }
    // Disallows unused private class members
    'no-unused-private-class-members': 'error',

    // ✅ const x = 1; console.log(x)
    // ❌ console.log(x); const x = 1
    // Disallows early use of variables and functions
    'no-use-before-define': 'error',

    // ✅ let x = getValue(); console.log(x)
    // ❌ let x = getValue(); x = getOther(); console.log(x)
    // Disallows variable assignments when the value is not used
    'no-useless-assignment': 'error',

    // ✅ fn()
    // ❌ fn.call(undefined)
    // Disallows unnecessary .call() and .apply()
    'no-useless-call': 'error',

    // ✅ try { risky() } catch { handle() }
    // ❌ try { risky() } catch (e) { throw e }
    // Disallows unnecessary catch clauses
    'no-useless-catch': 'error',

    // ✅ const obj = { foo: 'bar' }
    // ❌ const obj = { ['foo']: 'bar' }
    // Disallows unnecessary computed property keys in objects and classes
    'no-useless-computed-key': 'error',

    // ✅ const message = `Hello ${name}`
    // ❌ const message = 'Hello' + 'world'
    // Disallows unnecessary concatenation of literals or template literals
    'no-useless-concat': 'error',

    // ✅ class Base {}
    // ❌ class Base { constructor() {} }
    // Disallows unnecessary constructors
    'no-useless-constructor': 'error',

    // ✅ const x = /abc/
    // ❌ const x = /abc(\1)/
    // Disallows useless backreferences in regular expressions
    'no-useless-backreference': 'error',

    // ✅ /abc/
    // ❌ /\abc/
    // Disallows unnecessary escape characters
    'no-useless-escape': 'error',

    // ✅ import { foo } from 'bar'
    // ❌ import { foo as foo } from 'bar'
    // Disallows renaming import, export, and destructured assignments to the same name
    'no-useless-rename': 'error',

    // ✅ function fn() { return value }
    // ❌ function fn() { if (condition) return; return }
    // Disallows unnecessary return statements
    'no-useless-return': 'error',

    // ✅ const x = 1
    // ❌ var x = 1
    // Disallows the use of var
    'no-var': 'error',

    // ✅ fn()
    // ❌ void fn()
    // Disallows void operators
    'no-void': 'error',

    // ✅ // TODO: implement
    // ❌ // FIXME: hack
    // Disallows specified warning terms in comments
    'no-warning-comments': 'error',

    // ✅ if (condition) statement
    // ❌ with (obj) { property = value }
    // Disallows with statements
    'no-with': 'error',

    // ✅ const obj = { method() {} }
    // ❌ const obj = { method: function() {} }
    // Requires or disallows method and property shorthand syntax for object literals
    'object-shorthand': 'error',

    // ✅ const a = 1; const b = 2
    // ❌ const a = 1, b = 2
    // Enforces variables to be declared either together or separately in functions
    'one-var': ['error', 'never'],

    // ✅ x += 1
    // ❌ x = x + 1
    // Requires or disallows assignment operator shorthand where possible
    'operator-assignment': 'error',

    // ✅ [1, 2, 3].map(x => x * 2)
    // ❌ [1, 2, 3].map(function(x) { return x * 2 })
    // Requires using arrow functions for callbacks
    'prefer-arrow-callback': 'error',

    // ✅ const name = 'John'
    // ❌ let name = 'John'
    // Requires const declarations for variables that are never reassigned after declared
    'prefer-const': 'error',

    // ✅ const {a, b} = obj
    // ❌ const a = obj.a; const b = obj.b
    // Requires destructuring from arrays and/or objects
    'prefer-destructuring': 'error',

    // ✅ 2 ** 3
    // ❌ Math.pow(2, 3)
    // Prefers exponentiation operator over Math.pow()
    'prefer-exponentiation-operator': 'off',

    // ✅ /(?<name>abc)/
    // ❌ /(abc)/
    // Prefers named capture groups in regular expressions
    'prefer-named-capture-group': 'off',

    // ✅ const x = 0xFF
    // ❌ const x = parseInt('FF', 16)
    // Prefers numeric literals over parseInt()
    'prefer-numeric-literals': 'error',

    // ✅ Object.hasOwn(obj, 'key')
    // ❌ Object.prototype.hasOwnProperty.call(obj, 'key')
    // Disallows use of Object.prototype.hasOwnProperty.call() and prefers use of Object.hasOwn()
    'prefer-object-has-own': 'error',

    // ✅ const obj = { ...source }
    // ❌ const obj = Object.assign({}, source)
    // Prefers object spread over Object.assign()
    'prefer-object-spread': 'error',

    // ✅ Promise.reject(new Error())
    // ❌ new Promise((_, reject) => reject())
    // Prefers Promise.reject() over throwing in Promise constructor
    'prefer-promise-reject-errors': 'error',

    // ✅ /abc/.test(str)
    // ❌ str.match(/abc/) !== null
    // Prefers RegExp#test() over String#match()
    'prefer-regex-literals': 'error',

    // ✅ const arr = [...set]
    // ❌ const arr = Array.from(set)
    // Prefers rest parameters over arguments object
    'prefer-rest-params': 'error',

    // ✅ fn(...args)
    // ❌ fn.apply(null, args)
    // Prefers spread operator over .apply()
    'prefer-spread': 'error',

    // ✅ `hello ${name}`
    // ❌ 'hello ' + name
    // Prefers template literals over string concatenation
    'prefer-template': 'error',

    // ✅ try { risky() } catch (originalError) { throw new Error('Failed', { cause: originalError }) }
    // ❌ try { risky() } catch { throw new Error('Failed') }
    // Disallows losing originally caught error when re-throwing custom errors
    'preserve-caught-error': 'error',

    // ✅ parseInt(str, 10)
    // ❌ parseInt(str)
    // Requires radix parameter for parseInt()
    radix: 'error',

    // ✅ async function fn() {}
    // ❌ function fn() { return Promise.resolve() }
    // Disallows async functions which have no await expression
    'require-await': 'error',

    // ✅ let x = 0; x = await getValue()
    // ❌ x = await getValue()
    // Disallows assignments that can lead to race conditions due to usage of await or yield
    'require-atomic-updates': 'error',

    // ✅ /abc/u
    // ❌ /abc/
    // Enforces the use of u flag on RegExp
    'require-unicode-regexp': 'error',

    // ✅ function* gen() { yield* other() }
    // ❌ function* gen() { yield other() }
    // Requires generator functions to contain yield
    'require-yield': 'error',

    // ✅ import { a, b } from 'module'
    // ❌ import { b, a } from 'module'
    // Enforces sorted import declarations within modules
    'sort-imports': 'error',

    // ✅ { a: 1, b: 2 }
    // ❌ { b: 2, a: 1 }
    // Requires object keys to be sorted
    'sort-keys': 'error',

    // ✅ const a = 1, b = 2, c = 3
    // ❌ const c = 1, a = 2, b = 3
    // Requires variables within the same declaration block to be sorted
    'sort-vars': 'error',

    // ✅ 'use strict'
    // ❌ function() { 'use strict' }
    // Requires or disallows strict mode directives
    strict: 'error',

    // ✅ Symbol('description')
    // ❌ Symbol()
    // Requires descriptions for Symbol constructors
    'symbol-description': 'error',

    // ✅ isNaN(x)
    // ❌ x === NaN
    // Requires calls to isNaN() when checking for NaN
    'use-isnan': 'error',

    // ✅ typeof x === 'string'
    // ❌ typeof x === 'String'
    // Enforces comparing typeof expressions against valid strings
    'valid-typeof': 'error',

    // ✅ function fn() { var x = 1; var y = 2; }
    // ❌ function fn() { doSomething(); var x = 1; }
    // Requires var declarations be placed at the top of their containing scope
    'vars-on-top': 'error',

    // ✅ (function() {})()
    // ❌ function() {}()
    // Requires parentheses around immediate function invocations
    'wrap-iife': 'error',

    // ✅ if (value === 'red')
    // ❌ if ('red' === value)
    // Requires or disallows Yoda conditions
    yoda: 'error',
  },
});
