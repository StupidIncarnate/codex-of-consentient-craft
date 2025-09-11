module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/bin'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        'bin/**/*.ts',
        '!src/**/*.test.ts',
        '!bin/**/*.test.ts',
        '!src/**/*.d.ts',
    ],
};