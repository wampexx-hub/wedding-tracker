module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-native/all',
        'prettier'
    ],
    parser: '@babel/eslint-parser',
    plugins: ['react', 'react-native'],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        requireConfigFile: false,
    },
    env: {
        "react-native/react-native": true,
    },
    rules: {
        'react-native/no-unused-styles': 'warn',
        'react-native/split-platform-components': 'off',
        'react-native/no-inline-styles': 'off',
        'react-native/no-color-literals': 'off',
        'react/prop-types': 'off',
        'no-unused-vars': 'warn',
        'no-undef': 'error',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
};
