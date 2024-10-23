import react_lint_config from '@repo/eslint-config/eslint.react.mjs'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...react_lint_config,
  {
    files: ['src/**/*.{js,mjs,cjs,ts,jsx,tsx}'],
  },
]
