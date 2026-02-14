const Configuration = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 70],
    'subject-case': [2, 'always', 'lower-case'],
    'type-case': [2, 'always', 'lower-case'],
    'type-enum': [2, 'always',
      [
        'chore',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
  },
};

export default Configuration;
