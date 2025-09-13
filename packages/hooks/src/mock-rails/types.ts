export type MockCategory = 'system-boundary' | 'application-code' | 'third-party';

export type TestType = 'unit' | 'integration' | 'e2e';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'extreme';

export interface MockPattern {
    /** Unique identifier for this pattern */
    id: string;

    /** Module being mocked (e.g., 'child_process', 'fs') */
    module: string;

    /** Regex pattern to detect this mock in code */
    pattern: RegExp;

    /** Category of what's being mocked */
    category: MockCategory;

    /** Test types where this pattern is appropriate (empty = never appropriate) */
    testTypes: TestType[];

    /** Risk level for false positives */
    risk: RiskLevel;

    /** Implementation details for this mock pattern */
    implementation: {
        /** Code example showing how to implement this mock */
        code: string;
        /** Required imports for this implementation */
        imports: string[];
        /** Setup code needed in beforeEach/describe blocks */
        setup?: string;
    };

    /** Educational content explaining this pattern */
    education: {
        /** Why this pattern exists */
        why: string;
        /** What could go wrong with false positives */
        falsePositiveRisk: string;
        /** When this pattern is appropriate to use */
        whenAppropriate: string;
        /** Alternative pattern ID if this one is inappropriate */
        alternative?: string;
    };
}

export interface MockDetection {
    /** Pattern that was detected */
    pattern: MockPattern;
    /** Line number where detected */
    line: number;
    /** Column number where detected */
    column: number;
    /** The actual code that matched */
    matchedCode: string;
}

export interface MockValidationResult {
    /** Whether the mock usage should be blocked */
    blocked: boolean;

    /** Human-readable message explaining the result */
    message: string;

    /** All mock patterns that were detected */
    detectedMocks: MockDetection[];

    /** Violations (blocked patterns) */
    violations: MockDetection[];

    /** Suggested alternatives for violations */
    alternatives: Array<{
        violation: MockDetection;
        suggested: MockPattern;
    }>;
}

export interface MockRailsConfig {
    /** Whether mock boundary enforcement is enabled */
    enabled: boolean;

    /** Rules for what's allowed in each test type */
    rules: {
        unit: string[]; // Pattern IDs allowed for unit tests
        integration: string[]; // Pattern IDs allowed for integration tests
        e2e: string[]; // Pattern IDs allowed for e2e tests
    };

    /** Custom patterns defined by the user */
    customPatterns: MockPattern[];

    /** Educational settings */
    education: {
        /** Level of detail in violation messages */
        level: 'quiet' | 'normal' | 'verbose';
        /** Whether to show alternative implementations */
        showAlternatives: boolean;
        /** Whether to show code examples */
        showExamples: boolean;
    };
}
