import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ['dist', 'coverage', 'node_modules'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: ['resetTour', 'useAuth', 'useTheme'],
        },
      ],
      'no-unused-vars': 'off',
      'no-extra-boolean-cast': 'off',
    },
  },
  {
    files: ['vitest.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{test,spec}.{js,jsx}', '**/__tests__/**/*.{js,jsx}', 'src/test/setup.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
  {
    files: [
      'src/App.jsx',
      'src/components/Alert.jsx',
      'src/components/ConfirmDialog.jsx',
      'src/components/PublicNavBar.jsx',
      'src/components/Sidebar.jsx',
      'src/pages/UserProfile.jsx',
      'src/pages/SubjectDetail/ResultsTab.jsx',
      'src/pages/MyBulletins.jsx',
      'src/pages/AdminBulletins.jsx',
      'src/pages/Observer.jsx',
      'src/pages/StudentDashboard.jsx',
      'src/pages/TenantOperationsAudit.jsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            'Inline style is not allowed in governed files. Use design tokens/classes. If you truly need runtime-only style, document and approve it first.',
        },
      ],
    },
  },
];
