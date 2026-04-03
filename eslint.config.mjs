import js from '@eslint/js';

export default [
	js.configs.recommended,
	{
		files: ['**/*.ts'],
		rules: {
			'no-unused-vars': 'off',
		},
	},
	{
		ignores: ['dist/**', 'node_modules/**'],
	},
];
