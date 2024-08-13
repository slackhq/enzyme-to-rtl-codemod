module.exports = {
    preset: 'ts-jest',
    // TODO: check if this breaks logger silencing
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec|jest))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testPathIgnorePatterns: [
      '/node_modules/',
      '<rootDir>/support/ast-transformations/utils/test-data/',
      '<rootDir>/support/prompt-generation/utils/test-data/',
      ],
};
