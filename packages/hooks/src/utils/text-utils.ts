export const TextUtils = {
    stripStringLiterals: ({content}: { content: string }) =>
        // Only remove string literals, preserve comments for comment-based pattern detection
        content
            .replace(/'(?:[^'\\]|\\.)*'/g, "''") // Single quotes with proper escaping
            .replace(/"(?:[^"\\]|\\.)*"/g, '""') // Double quotes with proper escaping
            .replace(/`(?:[^`\\]|\\.)*`/g, '``'), // Template literals
    stripCommentsAndStringLiterals: ({content}: { content: string }) =>
        // Remove both comments and string literals for code-only pattern detection
        content
            // Remove single-line comments
            .replace(/\/\/.*$/gm, '')
            // Remove multi-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove string literals
            .replace(/'(?:[^'\\]|\\.)*'/g, "''")
            .replace(/"(?:[^"\\]|\\.)*"/g, '""')
            .replace(/`(?:[^`\\]|\\.)*`/g, '``'),
};
