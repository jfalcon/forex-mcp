import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  {
    ignores: [
      '.cache/**',
      'build/**',
      'data/**',
      'dist/**',
      'node_modules/**',
      '**/*.d.ts',
      '**/*.log',
    ],
  },

  // base rules with TypeScript support (no type-checking by default for speed)
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // project-wide settings
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // sane defaults
      'array-bracket-spacing': ['warn', 'never'],
      'comma-dangle': ['warn', 'always-multiline'],
      'computed-property-spacing': ['warn', 'never'],
      'no-undef': 'error',
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'object-curly-spacing': ['warn', 'always'],
      'quotes': ['error', 'single', { 'avoidEscape': true }],
      'semi': ['warn', 'always', {
        'omitLastInOneLineBlock': true,
      }],
      'space-before-function-paren': ['warn', {
        anonymous: 'always',
        asyncArrow: 'always',
        named: 'never',
      }],
      'space-in-parens': ['warn', 'never'],
      // TypeScript overrides
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // Node/CLI friendly
      'no-console': 'off',

      // modern JS
      'eqeqeq': ['error', 'smart'],
      'prefer-const': 'warn',
    },
  },
];
