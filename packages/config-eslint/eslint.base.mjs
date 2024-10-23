import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */
const base_lint_config = [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'import/no-default-export': 'off',
      camelcase: 'off',
    },
  },
]

export default base_lint_config
