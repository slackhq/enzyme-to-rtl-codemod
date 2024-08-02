module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec|jest))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], //src/support/prompt-generation/utils/test-data
    testPathIgnorePatterns: [
      '/node_modules/',
      // '<rootDir>/support/ast-transformations/utils/test-data/',
      // '<rootDir>/support/prompt-generation/utils/test-data/gen-prompt-test-file-no-tests.jest.tsx',
      // '<rootDir>/support/prompt-generation/utils/test-data'
      '<rootDir>/support/prompt-generation/utils/test-data/',
      ],
};
