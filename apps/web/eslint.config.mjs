import next_lint_config from '@repo/eslint-config/eslint.next.mjs'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...next_lint_config,
  {
    files: ['src/**/*.{js,mjs,cjs,ts,jsx,tsx}'],
  },
]
