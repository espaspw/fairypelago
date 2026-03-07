// @ts-check

import neostandard from 'neostandard'

export default [
  ...neostandard({
    ts: true,
    ignores: ['build/**/*']
  }), {
    files: ['src/data/icons.ts'],
    rules: {
      '@stylistic/quote-props': ['error', 'always'],
    },
  }
]
