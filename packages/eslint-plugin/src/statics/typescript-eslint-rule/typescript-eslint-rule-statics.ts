export const typescriptEslintRuleStatics = {
  rules: {
    // ✅ function foo(); function foo(x: string): void; function foo(x?: string) {}
    // ❌ function foo(x?: string): void; function foo(x: string) {}
    // Require that function overload signatures be consecutive
    '@typescript-eslint/adjacent-overload-signatures': 'error',

    // ✅ const numbers: number[] = [1, 2, 3]
    // ❌ const numbers: Array<number> = [1, 2, 3]
    // Require consistently using either T[] or Array<T> for arrays
    '@typescript-eslint/array-type': 'error',

    // ✅ await promise
    // ❌ await nonThenable
    // Disallow awaiting a value that is not a Thenable
    '@typescript-eslint/await-thenable': 'error',

    // ✅ // Regular comment explaining the code
    // ❌ // @ts-ignore, // @ts-expect-error, // @ts-nocheck, // @ts-check
    // Disallow all @ts-<directive> comments
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': true,
        'ts-ignore': true,
        'ts-nocheck': true,
        'ts-check': true,
      },
    ],

    // ✅ // This is intentionally left blank
    // ❌ // tslint:disable
    // Disallow // tslint:<rule-flag> comments
    '@typescript-eslint/ban-tslint-comment': 'error',

    // ✅ const obj = { foo: 'bar' }
    // ❌ const obj = { 'foo': 'bar' }
    // Enforce that literals on classes are exposed in a consistent style
    '@typescript-eslint/class-literal-property-style': 'error',

    // ✅ class Foo { method() { return this.bar } }
    // ❌ class Foo { method() { return 5 } }
    // Enforce that class methods use this
    '@typescript-eslint/class-methods-use-this': 'error',

    // ✅ const map = new Map<string, number>()
    // ❌ const map: Map<string, number> = new Map()
    // Enforce specifying generic type arguments on constructor name rather than type annotation
    '@typescript-eslint/consistent-generic-constructors': 'error',

    // ✅ type T = Record<string, number>
    // ❌ type T = { [key: string]: number }
    // Require or disallow the Record type
    '@typescript-eslint/consistent-indexed-object-style': 'error',

    // ✅ function foo() { if (x) return x; return undefined }
    // ❌ function foo() { if (x) return x }
    // Require return statements to either always or never specify values
    '@typescript-eslint/consistent-return': 'error',

    // ✅ const x = value as string
    // ❌ const x = <string>value
    // Enforce consistent usage of type assertions
    '@typescript-eslint/consistent-type-assertions': 'error',

    // ✅ interface Foo { bar: string }
    // ❌ type Foo = { bar: string }
    // Enforce type definitions to consistently use interface over type for object definitions
    '@typescript-eslint/consistent-type-definitions': 'error',

    // ✅ export type { Foo }
    // ❌ export { type Foo }
    // Enforce consistent usage of type exports
    '@typescript-eslint/consistent-type-exports': 'error',

    // ✅ import type { Foo } from 'foo'
    // ❌ import { type Foo } from 'foo'
    // Enforce consistent usage of type imports
    '@typescript-eslint/consistent-type-imports': 'error',

    // ✅ function fn(a: number, b = 1) {}
    // ❌ function fn(a = 1, b: number) {}
    // Enforce default parameters to be last
    '@typescript-eslint/default-param-last': 'error',

    // ✅ obj.property
    // ❌ obj['property']
    // Enforce dot notation whenever possible
    '@typescript-eslint/dot-notation': 'error',

    // ✅ function fn(): string { return 'foo' }
    // ❌ function fn() { return 'foo' }
    // ✅ const config = () => ({ key: 'value' }) // allowExpressions
    // Require explicit return types on functions and class methods
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
      },
    ],

    // ✅ class Foo { public bar() {} }
    // ❌ class Foo { bar() {} }
    // Require explicit accessibility modifiers on class properties and methods
    '@typescript-eslint/explicit-member-accessibility': 'error',

    // ✅ export function fn(): string { return 'foo' }
    // ❌ export function fn() { return 'foo' }
    // ✅ export const fn = () => ({ ... }) as const
    // Require explicit return and argument types on exported functions and methods
    '@typescript-eslint/explicit-module-boundary-types': [
      'error',
      {
        allowDirectConstAssertionInArrowFunctions: true,
      },
    ],

    // ✅ let foo: number; foo = 5;
    // ❌ let foo; foo = 5;
    // Require or disallow initialization in variable declarations
    '@typescript-eslint/init-declarations': 'error',

    // ✅ function fn(a: string, b: number) {}
    // ❌ function fn(a: string, b: number, c: boolean, d: object, e: any) {}
    // Enforce a maximum number of parameters in function definitions
    // This is problematic for baked in usages like if we set to 1
    // .filter((value, index, self) => self.indexOf(value) === index);
    '@typescript-eslint/max-params': 'off',

    // ✅ class Foo { private _bar: string; constructor() {} getBar() {} }
    // ❌ class Foo { constructor() {} private _bar: string; getBar() {} }
    // Require a consistent member declaration order
    '@typescript-eslint/member-ordering': 'error',

    // ✅ interface Foo { bar(): string }
    // ❌ interface Foo { bar: () => string }
    // Enforce using a particular method signature syntax
    '@typescript-eslint/method-signature-style': 'error',

    // ✅ const userName = 'john'
    // ❌ const user_name = 'john'
    // Enforce naming conventions for everything across a codebase
    // Problematic for this file specifically
    // '@typescript-eslint/naming-convention': 'error',

    // ✅ const arr = [1, 2, 3]
    // ❌ const arr = new Array(1, 2, 3)
    // Disallow the Array constructor
    '@typescript-eslint/no-array-constructor': 'error',

    // ✅ array.splice(index, 1)
    // ❌ delete array[index]
    // Disallow using the delete operator on array values
    '@typescript-eslint/no-array-delete': 'error',

    // ✅ String(value)
    // ❌ value.toString()
    // Disallow calling toString() on values that might not have a meaningful string representation
    '@typescript-eslint/no-base-to-string': 'error',

    // ✅ const x = value!
    // ❌ const x = (!value!)
    // Disallow non-null assertion in locations that may be confusing
    '@typescript-eslint/no-confusing-non-null-assertion': 'error',

    // ✅ fn(() => { doSomething(); return 123; })
    // ❌ fn(() => doSomething())
    // Require expressions of type void to appear in statement position
    '@typescript-eslint/no-confusing-void-expression': 'error',

    // ✅ const fn = () => {}
    // ❌ /** @deprecated */ const fn = () => {}
    // Disallow the use of deprecated APIs
    '@typescript-eslint/no-deprecated': 'error',

    // ✅ class Foo { bar() {} baz() {} }
    // ❌ class Foo { bar() {} bar() {} }
    // Disallow duplicate class members
    '@typescript-eslint/no-dupe-class-members': 'error',

    // ✅ enum Foo { A = 1, B = 2 }
    // ❌ enum Foo { A = 1, B = 1 }
    // Disallow duplicate enum member values
    '@typescript-eslint/no-duplicate-enum-values': 'error',

    // ✅ type T = string | number
    // ❌ type T = string | string | number
    // Disallow duplicate constituents of unions or intersections
    '@typescript-eslint/no-duplicate-type-constituents': 'error',

    // ✅ delete obj.property
    // ❌ delete obj[computed]
    // Disallow using the delete operator on computed key expressions
    '@typescript-eslint/no-dynamic-delete': 'error',

    // ✅ function fn() { doSomething() }
    // ❌ function fn() {}
    // Disallow empty functions
    '@typescript-eslint/no-empty-function': 'error',

    // ✅ interface Props {}, type Config = {}
    // ❌ type T = {}, const x: {} = value
    // Disallow the {} type except for interfaces and named types
    '@typescript-eslint/no-empty-object-type': [
      'error',
      {
        allowInterfaces: 'always',
        allowObjectTypes: 'always',
        allowWithName: '^[A-Z]',
      },
    ],

    // ✅ const x: string = getValue()
    // ❌ const x: any = getValue()
    // Disallow the any type
    '@typescript-eslint/no-explicit-any': 'error',

    // ✅ const x = value!
    // ❌ const x = value!!
    // Disallow extra non-null assertion
    '@typescript-eslint/no-extra-non-null-assertion': 'error',

    // ✅ const utils = { helper() {} }
    // ❌ class Utils { static helper() {} }
    // Disallow classes used as namespaces
    '@typescript-eslint/no-extraneous-class': 'error',

    // ✅ void promise
    // ❌ promise
    // Require Promise-like statements to be handled appropriately
    '@typescript-eslint/no-floating-promises': 'error',

    // ✅ for (const item of items) {}
    // ❌ for (const item in items) {}
    // Disallow iterating over an array with a for-in loop
    '@typescript-eslint/no-for-in-array': 'error',

    // ✅ function fn() { return new Function('return 1') }
    // ❌ setTimeout('code', 100)
    // Disallow the use of eval()-like methods
    '@typescript-eslint/no-implied-eval': 'error',

    // ✅ import type { Foo } from 'foo'
    // ❌ import { Foo } from 'foo'
    // Enforce the use of top-level import type qualifier when an import only has specifiers with inline type qualifiers
    '@typescript-eslint/no-import-type-side-effects': 'error',

    // ✅ const x = 5
    // ❌ const x: number = 5
    // Disallow explicit type declarations for variables or parameters initialized to a number, string, or boolean
    '@typescript-eslint/no-inferrable-types': 'error',

    // ✅ function method() { return this.value }
    // ❌ function standalone() { return this.value }
    // Disallow this keywords outside of classes or class-like objects (handled by TypeScript compiler)
    '@typescript-eslint/no-invalid-this': 'off',

    // ✅ function fn(): void {}
    // ❌ const x: void = undefined, function fn(param: void) {}
    // Disallow void type outside of generic or return types
    '@typescript-eslint/no-invalid-void-type': 'error',

    // ✅ for (const item of items) { const result = await process(item) }
    // ❌ for (const item of items) { const fn = () => { await process(item) } }
    // Disallow function declarations that contain unsafe references inside loop statements
    '@typescript-eslint/no-loop-func': 'error',

    // ✅ const x = 9007199254740991
    // ❌ const x = 9007199254740992
    // Disallow literal numbers that lose precision
    // Depreciated
    // '@typescript-eslint/no-loss-of-precision': 'off',

    // ✅ const TIMEOUT = 1000; setTimeout(callback, TIMEOUT)
    // ❌ setTimeout(callback, 1000)
    // Disallow magic numbers (disabled for testing as test data often uses literal values)
    '@typescript-eslint/no-magic-numbers': [
      'error',
      {
        ignore: [-1, 0, 1],
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        ignoreClassFieldInitialValues: true,
        detectObjects: false,
        ignoreEnums: true,
        ignoreNumericLiteralTypes: true,
        ignoreReadonlyClassProperties: true,
        ignoreTypeIndexes: true,
      },
    ],

    // ✅ Boolean(value)
    // ❌ void 0
    // Disallow the void operator except when used to discard a value
    '@typescript-eslint/no-meaningless-void-operator': 'error',

    // ✅ class Foo {}
    // ❌ interface Foo { new (): Foo }
    // Enforce valid definition of new and constructor
    '@typescript-eslint/no-misused-new': 'error',

    // ✅ void promise
    // ❌ if (promise) {}
    // Disallow Promises in places not designed to handle them
    '@typescript-eslint/no-misused-promises': 'error',

    // ✅ fn(...args)
    // ❌ fn(...[...args])
    // Disallow incorrect usage of spread syntax
    '@typescript-eslint/no-misused-spread': 'error',

    // ✅ enum E { A = 'a', B = 'b' }
    // ❌ enum E { A = 'a', B = 1 }
    // Disallow enums having both string and number members
    '@typescript-eslint/no-mixed-enums': 'error',

    // ✅ export const foo = 'bar'
    // ❌ namespace Foo { export const bar = 'baz' }
    // Disallow TypeScript namespaces
    '@typescript-eslint/no-namespace': 'error',

    // ✅ const x = value ?? fallback
    // ❌ const x = value! ?? fallback
    // Disallow non-null assertions in the left operand of a nullish coalescing operator
    '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',

    // ✅ const x = value?.prop
    // ❌ const x = value!?.prop
    // Disallow non-null assertions after an optional chain expression
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',

    // ✅ const x = value as string
    // ❌ const x = value!
    // Disallow non-null assertions using the ! postfix operator
    '@typescript-eslint/no-non-null-assertion': 'error',

    // ✅ const x = 1; function fn() { const x = 2 }
    // ❌ const x = 1; const x = 2
    // Disallow variable redeclaration
    '@typescript-eslint/no-redeclare': 'error',

    // ✅ type T = string | number
    // ❌ type T = string | string | number
    // Disallow members of unions and intersections that do nothing or override type information
    '@typescript-eslint/no-redundant-type-constituents': 'error',

    // ✅ import foo from 'foo'
    // ❌ const foo = require('foo'), import foo = require('foo')
    // Disallow invocation of require()
    // Will need to cover with a special rule cause of file config importing
    '@typescript-eslint/no-require-imports': 'off',

    // ✅ import { allowed } from 'allowed-module'
    // ❌ import { denied } from 'denied-module'
    // Disallow specified modules when loaded by import (when configured with restrictions)
    // Example config: { paths: ['lodash'], patterns: ['@internal/*'] }
    // Needs to be customized
    '@typescript-eslint/no-restricted-imports': 'off',

    // ✅ const value: string = getValue()
    // ❌ const value: any = getValue()
    // Disallow certain types (when configured with type restrictions)
    // Example config: { types: { any: 'Use specific types instead' } }
    // Needs to be customized
    '@typescript-eslint/no-restricted-types': 'off',

    // ✅ const outer = 1; function fn() { const inner = 2 }
    // ❌ const name = 1; function fn() { const name = 2 }
    // Disallow variable declarations from shadowing variables declared in the outer scope
    '@typescript-eslint/no-shadow': 'error',

    // ✅ const self = this; callback(() => self.method())
    // ❌ const that = this; const me = this;
    // Disallow aliasing this
    '@typescript-eslint/no-this-alias': 'error',

    // ✅ interface User { name: string }
    // ❌ type User = { name: string }
    // Disallow type aliases (prefers interfaces)
    // Depreciated
    // '@typescript-eslint/no-type-alias': 'error',

    // ✅ if (value) {}
    // ❌ if (value === true) {}
    // Disallow unnecessary equality comparisons against boolean literals
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',

    // ✅ if (value) {}
    // ❌ if (value !== null && value !== undefined) {}
    // Disallow conditionals where the type is always truthy or always falsy
    '@typescript-eslint/no-unnecessary-condition': 'error',

    // ✅ class Foo { constructor(public bar: string) {} }
    // ❌ class Foo { constructor(public bar: string) { this.bar = bar } }
    // Disallow unnecessary assignment of constructor property parameter
    '@typescript-eslint/no-unnecessary-parameter-property-assignment': 'error',

    // ✅ foo.bar
    // ❌ A.B.foo.bar
    // Disallow unnecessary namespace qualifiers
    '@typescript-eslint/no-unnecessary-qualifier': 'error',

    // ✅ `hello ${name}`
    // ❌ `hello ${'world'}`
    // Disallow unnecessary template literals
    '@typescript-eslint/no-unnecessary-template-expression': 'error',

    // ✅ fn(value)
    // ❌ fn<string>(value)
    // Disallow type arguments that are equal to the default
    '@typescript-eslint/no-unnecessary-type-arguments': 'error',

    // ✅ const x = value
    // ❌ const x = value as string
    // Disallow type assertions that do not change the type of an expression
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',

    // ✅ function fn<T>() {}
    // ❌ function fn<T extends any>() {}
    // Disallow unnecessary constraints on generic types
    '@typescript-eslint/no-unnecessary-type-constraint': 'error',

    // ✅ String(value)
    // ❌ value as string
    // Disallow unnecessary type conversions
    '@typescript-eslint/no-unnecessary-type-conversion': 'error',

    // ✅ function fn() {}
    // ❌ function fn<T>() {}
    // Disallow type parameters that only appear once
    '@typescript-eslint/no-unnecessary-type-parameters': 'error',

    // ✅ fn(value as string)
    // ❌ fn(value as any)
    // Disallow calling a function with a value with type any
    '@typescript-eslint/no-unsafe-argument': 'error',

    // ✅ const x: string = getValue()
    // ❌ const x: string = getValue() as any
    // Disallow assigning a value with type any to variables and properties
    // It must be typed as unknown so you can then pass through typeguards
    '@typescript-eslint/no-unsafe-assignment': 'error',

    // ✅ fn(value)
    // ❌ (value as any)()
    // Disallow calling a value with type any
    '@typescript-eslint/no-unsafe-call': 'error',

    // ✅ interface Foo {} interface Bar {}
    // ❌ interface Foo {} interface Foo {}
    // Disallow unsafe declaration merging
    '@typescript-eslint/no-unsafe-declaration-merging': 'error',

    // ✅ if (enumValue === MyEnum.A) {}
    // ❌ if (enumValue === 'A') {}
    // Disallow comparing an enum value with a non-enum value
    '@typescript-eslint/no-unsafe-enum-comparison': 'error',

    // ✅ const fn: () => string = getValue()
    // ❌ const fn: Function = getValue()
    // Disallow using the unsafe built-in Function type
    '@typescript-eslint/no-unsafe-function-type': 'error',

    // ✅ const x = value.prop
    // ❌ const x = (value as any).prop
    // Disallow member access on a value with type any
    '@typescript-eslint/no-unsafe-member-access': 'error',

    // ✅ function fn(): string { return getValue() }
    // ❌ function fn(): string { return getValue() as any }
    // Disallow returning a value with type any from a function
    '@typescript-eslint/no-unsafe-return': 'error',

    // ✅ const x = value as string
    // ❌ const x = value as any
    // Disallow type assertions that narrow the type to less safe alternatives
    '@typescript-eslint/no-unsafe-type-assertion': 'warn',

    // ✅ const x = -5
    // ❌ const x = -(value as any)
    // Disallow applying the - operator to possibly non-numeric operands
    '@typescript-eslint/no-unsafe-unary-minus': 'error',

    // ✅ const result = getValue()
    // ❌ getValue(); x + y;
    // Disallow unused expressions
    '@typescript-eslint/no-unused-expressions': 'error',

    // ✅ function used(param: string) { return param } ❌ function unused(param: string) { return 'hello' }
    // Disallow unused variables
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],

    // ✅ const x = getValue(); use(x)
    // ❌ use(x); const x = getValue()
    // Disallow early use of variables and functions
    '@typescript-eslint/no-use-before-define': 'error',

    // ✅ class Base {}
    // ❌ class Base { constructor() {} }
    // Disallow unnecessary constructors
    '@typescript-eslint/no-useless-constructor': 'error',

    // ✅ export { foo }
    // ❌ export {}
    // Disallow empty exports that don't change anything in a module file
    '@typescript-eslint/no-useless-empty-export': 'error',

    // ✅ import foo = require('foo')
    // ❌ const foo = require('foo')
    // Disallow require statements except in import statements
    // Depreciated
    // '@typescript-eslint/no-var-requires': 'error',

    // ✅ const x: object = {}
    // ❌ const x: Object = {}
    // Disallow wrapper object types (Object, String, Number, Boolean)
    '@typescript-eslint/no-wrapper-object-types': 'error',

    // ✅ const x = value!
    // ❌ const x = value as NonNullable<typeof value>
    // Enforce non-null assertions over explicit type casts
    '@typescript-eslint/non-nullable-type-assertion-style': 'error',

    // ✅ throw new Error('message')
    // ❌ throw 'string'
    // Restrict what can be thrown as an exception
    '@typescript-eslint/only-throw-error': 'error',

    // ✅ class Foo { constructor(private bar: string) {} }
    // ❌ class Foo { private bar: string; constructor(bar: string) { this.bar = bar } }
    // Require or disallow parameter properties in class constructors
    '@typescript-eslint/parameter-properties': 'error',

    // ✅ const x = 'hello' as const
    // ❌ const x = <const>'hello'
    // Enforce the use of as const over literal type
    '@typescript-eslint/prefer-as-const': 'error',

    // ✅ const {a, b} = obj
    // ❌ const a = obj.a; const b = obj.b
    // Require destructuring from arrays and/or objects
    '@typescript-eslint/prefer-destructuring': 'error',

    // ✅ enum Color { Red = 'red', Blue = 'blue' }
    // ❌ enum Color { Red, Blue }
    // Require each enum member value to be explicitly initialized
    '@typescript-eslint/prefer-enum-initializers': 'error',

    // ✅ array.find(x => x > 5)
    // ❌ array.filter(x => x > 5)[0]
    // Enforce the use of Array.prototype.find() over Array.prototype.filter() followed by [0]
    '@typescript-eslint/prefer-find': 'error',

    // ✅ for (const item of items) {}
    // ❌ for (let i = 0; i < items.length; i++) {}
    // Enforce the use of for-of loop over the standard for loop where possible
    '@typescript-eslint/prefer-for-of': 'error',

    // ✅ type EventListener = (event: Event) => void
    // ❌ interface EventListener { (event: Event): void }
    // Enforce using function types instead of interfaces with call signatures
    '@typescript-eslint/prefer-function-type': 'error',

    // ✅ str.includes('substring')
    // ❌ str.indexOf('substring') !== -1
    // Enforce includes method over indexOf method
    '@typescript-eslint/prefer-includes': 'error',

    // ✅ enum Color { Red = 'red' }
    // ❌ enum Color { Red = getValue() }
    // Require all enum members to be literal values
    '@typescript-eslint/prefer-literal-enum-member': 'error',

    // ✅ namespace Foo {}
    // ❌ module Foo {}
    // Require using namespace keyword over module keyword to declare custom TypeScript modules
    '@typescript-eslint/prefer-namespace-keyword': 'error',

    // ✅ const x = value ?? 'default'
    // ❌ const x = value || 'default'
    // Enforce using the nullish coalescing operator instead of logical assignments or chaining
    '@typescript-eslint/prefer-nullish-coalescing': 'error',

    // ✅ const x = value?.prop
    // ❌ const x = value && value.prop
    // Enforce using concise optional chain expressions instead of chained logical ands, negated logical ors, or empty objects
    '@typescript-eslint/prefer-optional-chain': 'error',

    // ✅ Promise.reject(new Error())
    // ❌ Promise.reject('string')
    // Require using Error objects as Promise rejection reasons
    '@typescript-eslint/prefer-promise-reject-errors': 'error',

    // ✅ class Foo { private readonly bar = 'baz' }
    // ❌ class Foo { private bar = 'baz' }
    // Require private members to be marked as readonly if they're never modified outside of the constructor
    '@typescript-eslint/prefer-readonly': 'error',

    // ✅ function fn(items: readonly string[]) {}
    // ❌ function fn(items: string[]) {}
    // Require function parameters to be typed as readonly to prevent accidental mutation of inputs
    // This will force a lot of churn for LLM
    // '@typescript-eslint/prefer-readonly-parameter-types': 'error',

    // ✅ array.reduce<number>((acc, val) => acc + val, 0)
    // ❌ array.reduce((acc, val) => acc + val, 0)
    // Enforce using type parameter when calling Array#reduce instead of casting
    '@typescript-eslint/prefer-reduce-type-parameter': 'error',

    // ✅ /pattern/.exec(str)
    // ❌ str.match(/pattern/)
    // Enforce RegExp#exec over String#match if no global flag is provided
    '@typescript-eslint/prefer-regexp-exec': 'error',

    // ✅ class Foo { method(): this { return this } }
    // ❌ class Foo { method(): Foo { return this } }
    // Enforce that this is used when only this type is returned
    '@typescript-eslint/prefer-return-this-type': 'error',

    // ✅ str.startsWith('prefix')
    // ❌ str.indexOf('prefix') === 0
    // Enforce the use of String#startsWith and String#endsWith over other equivalent methods of checking substrings
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',

    // ✅ // @ts-expect-error
    // ❌ // @ts-ignore
    // Enforce using @ts-expect-error over @ts-ignore
    // Depreciated
    // '@typescript-eslint/prefer-ts-expect-error': 'error',

    // ✅ async function fn() { return await promise }
    // ❌ function fn() { return promise }
    // Require any function or method that returns a Promise to be marked async
    '@typescript-eslint/promise-function-async': 'error',

    // ✅ class Foo { get bar() {} set bar(value) {} }
    // ❌ class Foo { get bar() {} }
    // Require getter and setter pairs in objects and classes
    '@typescript-eslint/related-getter-setter-pairs': 'error',

    // ✅ array.sort((a, b) => a.localeCompare(b))
    // ❌ array.sort()
    // Require Array#sort calls to always provide a compareFunction
    '@typescript-eslint/require-array-sort-compare': 'error',

    // ✅ async function fn() { await promise; return value }
    // ❌ async function fn() { return 42 }
    // Disallow async functions which have no await expression and don't return Promise
    '@typescript-eslint/require-await': 'error',

    // ✅ const x = a + b
    // ❌ const x = a + '' + b
    // Require both operands of addition to be the same type and be bigint, number, or string
    '@typescript-eslint/restrict-plus-operands': 'error',

    // ✅ `hello ${name}`
    // ❌ `hello ${123}`
    // Enforce template literal expressions to be of string type
    '@typescript-eslint/restrict-template-expressions': 'error',

    // ✅ return await promise
    // ❌ return promise
    // Enforce consistent returning of awaited values
    '@typescript-eslint/return-await': 'error',

    // ✅ type T = A | B | C
    // ❌ type T = B | A | C
    // Enforce members of a type union/intersection to be sorted alphabetically
    // Depreciated
    // '@typescript-eslint/sort-type-constituents': 'error',

    // ✅ if (Boolean(value)) {}
    // ❌ if (value) {}
    // Disallow certain types in boolean expressions
    // LLM seems to be trained on traditional if(!something) which is usually fine. We'll see though....
    '@typescript-eslint/strict-boolean-expressions': 'off',

    // ✅ switch (value) { case A: case B: default: }
    // ❌ switch (value) { case A: }
    // Require switch-case statements to be exhaustive
    '@typescript-eslint/switch-exhaustiveness-check': 'error',

    // ✅ import { foo } from './foo'
    // ❌ /// <reference path="./foo.ts" />
    // Disallow certain triple slash directives in favor of ES6-style import declarations
    '@typescript-eslint/triple-slash-reference': 'error',

    // ✅ const x: string = getValue()
    // ❌ const x = getValue()
    // Require type annotations in certain places
    // Depreciated
    // '@typescript-eslint/typedef': 'error',

    // ✅ obj.method.bind(obj), callback(() => obj.method())
    // ❌ const fn = obj.method; fn() // loses 'this' context
    // Enforce unbound methods are called with their expected scope
    '@typescript-eslint/unbound-method': 'error',

    // ✅ function foo(a: string): void; function foo(a: number): void; function foo(a: string | number): void {}
    // ❌ function foo(a: string): void; function foo(a: number): void; function bar(a: string | number): void {}
    // Disallow two overloads that could be unified into one with a union or an optional/rest parameter
    '@typescript-eslint/unified-signatures': 'error',

    // ✅ } catch (error: unknown) { if (error instanceof Error) {} }
    // ❌ } catch (error) { console.log(error.message) }
    // Enforce typing arguments in .catch() callbacks as unknown
    '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
  },
} as const;
