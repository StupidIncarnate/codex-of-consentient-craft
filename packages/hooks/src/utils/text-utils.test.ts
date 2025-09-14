import {TextUtils} from './text-utils';

describe('TextUtils', () => {
    describe('stripStringLiterals()', () => {
        it('VALID: {content: \'const x = "hello";\'} => returns stripped string literals', () => {
            const result = TextUtils.stripStringLiterals({content: 'const x = "hello";'});
            expect(result).toBe('const x = "";');
        });

        it("VALID: {content: 'const x = \\'hello\\';'} => returns stripped single quotes", () => {
            const result = TextUtils.stripStringLiterals({content: "const x = 'hello';"});
            expect(result).toBe("const x = '';");
        });

        it("VALID: {content: 'const x = `hello`;'} => returns stripped template literals", () => {
            const result = TextUtils.stripStringLiterals({content: 'const x = `hello`;'});
            expect(result).toBe('const x = ``;');
        });

        it('VALID: {content: \'const x = "hello"; // comment\'} => preserves comments', () => {
            const result = TextUtils.stripStringLiterals({content: 'const x = "hello"; // comment'});
            expect(result).toBe('const x = ""; // comment');
        });

        it('VALID: {content: "string with escaped quotes"} => handles escaped quotes', () => {
            const result = TextUtils.stripStringLiterals({content: 'const x = "nested \\"quote\\"";'});
            expect(result).toBe('const x = "";');
        });

        it('VALID: {content: "string with escaped single quotes"} => handles escaped single quotes', () => {
            const result = TextUtils.stripStringLiterals({
                content: "const x = 'escaped \\'quote\\'\';",
            });
            expect(result).toBe("const x = '';");
        });

        it('VALID: {content: "template with escaped backticks"} => handles escaped backticks', () => {
            const result = TextUtils.stripStringLiterals({
                content: 'const x = `template with \\`backtick\\``;',
            });
            expect(result).toBe('const x = ``;');
        });

        it('VALID: {content: \'const x = "multi\\\\nline\\\\nstring";\'} => handles multiline in string', () => {
            const result = TextUtils.stripStringLiterals({
                content: 'const x = "multi\\nline\\nstring";',
            });
            expect(result).toBe('const x = "";');
        });

        it("EMPTY: {content: ''} => returns empty string", () => {
            const result = TextUtils.stripStringLiterals({content: ''});
            expect(result).toBe('');
        });

        it("EDGE: {content: 'no strings here'} => returns unchanged", () => {
            const result = TextUtils.stripStringLiterals({content: 'const x = 42; let y = true;'});
            expect(result).toBe('const x = 42; let y = true;');
        });

        it('EDGE: {content: \'const x = "";\'} => handles empty string literals', () => {
            const result = TextUtils.stripStringLiterals({content: 'const x = "";'});
            expect(result).toBe('const x = "";');
        });

        it('EDGE: {content: \'const x = """"\'} => handles consecutive empty strings', () => {
            const result = TextUtils.stripStringLiterals({content: 'const x = """";'});
            expect(result).toBe('const x = """";');
        });
    });

    describe('stripCommentsAndStringLiterals()', () => {
        it('VALID: {content: \'const x = "hello"; // comment\'} => removes both strings and comments', () => {
            const result = TextUtils.stripCommentsAndStringLiterals({
                content: 'const x = "hello"; // comment',
            });
            expect(result).toBe('const x = ""; ');
        });

        it("VALID: {content: 'const x = \\'hello\\'; /* block comment */'} => removes single quotes and block comments", () => {
            const result = TextUtils.stripCommentsAndStringLiterals({
                content: "const x = 'hello'; /* block comment */",
            });
            expect(result).toBe("const x = ''; ");
        });

        it("VALID: {content: 'const x = `hello`; // line comment'} => removes template literals and line comments", () => {
            const result = TextUtils.stripCommentsAndStringLiterals({
                content: 'const x = `hello`; // line comment',
            });
            expect(result).toBe('const x = ``; ');
        });

        it("VALID: {content: '// comment only'} => removes single line comment", () => {
            const result = TextUtils.stripCommentsAndStringLiterals({content: '// comment only'});
            expect(result).toBe('');
        });

        it("VALID: {content: '/* block comment */'} => removes block comment", () => {
            const result = TextUtils.stripCommentsAndStringLiterals({content: '/* block comment */'});
            expect(result).toBe('');
        });

        it("VALID: {content: '/* multi\\\\nline\\\\nblock */'} => removes multiline block comment", () => {
            const result = TextUtils.stripCommentsAndStringLiterals({
                content: '/* multi\nline\nblock */',
            });
            expect(result).toBe('');
        });

        it("VALID: {content: 'code // comment\\\\nmore code'} => removes single line comment preserving newlines", () => {
            const result = TextUtils.stripCommentsAndStringLiterals({
                content: 'const x = 5; // comment\nconst y = 10;',
            });
            expect(result).toBe('const x = 5; \nconst y = 10;');
        });

        it('VALID: {content: \'const x = "string with // fake comment";\'} => removes string but preserves fake comment syntax inside', () => {
            const result = TextUtils.stripCommentsAndStringLiterals({
                content: 'const x = "string with // fake comment";',
            });
            expect(result).toBe('const x = "string with ');
        });

        it('VALID: {content: "string with escaped quotes and comments"} => handles escaped quotes with comments', () => {
            const result = TextUtils.stripCommentsAndStringLiterals({
                content: 'const x = "nested \\"quote\\""; /* comment */',
            });
            expect(result).toBe('const x = ""; ');
        });

        it("EMPTY: {content: ''} => returns empty string", () => {
            const result = TextUtils.stripCommentsAndStringLiterals({content: ''});
            expect(result).toBe('');
        });

        it("EDGE: {content: 'no comments or strings'} => returns unchanged", () => {
            const result = TextUtils.stripCommentsAndStringLiterals({
                content: 'const x = 42; let y = true;',
            });
            expect(result).toBe('const x = 42; let y = true;');
        });

        it("EDGE: {content: '/* nested /* comment */ */'} => handles nested comment syntax", () => {
            const result = TextUtils.stripCommentsAndStringLiterals({
                content: '/* nested /* comment */ */',
            });
            expect(result).toBe(' */');
        });

        it('EDGE: {content: \'// comment with "string in comment"\'} => removes entire line including string syntax', () => {
            const result = TextUtils.stripCommentsAndStringLiterals({
                content: '// comment with "string in comment"',
            });
            expect(result).toBe('');
        });
    });
});
