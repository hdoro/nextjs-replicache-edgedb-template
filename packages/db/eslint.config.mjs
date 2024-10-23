import base_lint_config from '@repo/eslint-config/eslint.base.mjs'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base_lint_config,
  {
    files: ['src/**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    ignores: ['src/generated/*'],
  },
]
