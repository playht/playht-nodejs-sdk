module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier', // https://prettier.io/docs/en/install.html#eslint-and-other-linters
  ],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './example/tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'prefer-template': 'error',
    '@typescript-eslint/array-type': ['error', { default: 'generic', readonly: 'generic' }],
    '@typescript-eslint/ban-ts-comment': [
      'error',
      { 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 3 },
    ],
    '@typescript-eslint/require-array-sort-compare': ['error', { ignoreStringArrays: true }],
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/no-for-in-array': 'error',
    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    'import/no-duplicates': 'error',
    'import/no-self-import': 'error',
    'import/no-cycle': 'error',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true, packageDir: ['./example', './'] }],
    'import/no-import-module-exports': 'error',
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'error',
    'import/no-unresolved': 'off',
    'import/namespace': 'off',
    'import/order': [
      'error',
      {
        'newlines-between': 'never',
        groups: ['type', 'builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',

    'no-debugger': 'error',
    'no-process-env': 'error',
  },
};
