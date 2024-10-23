import pluginReact from 'eslint-plugin-react'
import base_lint_config from './eslint.base.mjs'

/** @type {import('eslint').Linter.Config[]} */
const react_lint_config = [
  ...base_lint_config,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
  },
]

export default react_lint_config
