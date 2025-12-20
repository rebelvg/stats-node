import tseslint from 'typescript-eslint';

export default [
  {
    files: ['./src/**/*.ts'],
    ignores: [],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      'no-console': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
      indent: ['off', 2],
      quotes: [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: true },
      ],
      semi: ['error', 'always'],
      'eol-last': ['error', 'always'],
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'prefer-arrow-callback': ['error'],
      'require-await': 'error',
      'no-case-declarations': 0,
      'prefer-const': [
        'error',
        {
          destructuring: 'all',
          ignoreReadBeforeAssign: false,
        },
      ],
      'no-prototype-builtins': 'off',
      'newline-after-var': ['error', 'always'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-require-imports': ['error'],
      'no-return-await': 'off',
      '@typescript-eslint/return-await': 'error',
      'object-shorthand': 'error',
      'no-useless-rename': 'error',
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
    },
  },
];
