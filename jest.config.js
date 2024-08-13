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
      '/src/support/ast-transformations/utils/test-data/',
      '/src/support/prompt-generation/utils/test-data/',
      '/src/support/enzyme-helper/test-data/',
      ],
};
