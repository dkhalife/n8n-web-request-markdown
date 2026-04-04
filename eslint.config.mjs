import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';

export default [
	...configWithoutCloudSupport,
	{
		files: ['nodes/**/*.ts'],
		rules: {
			// This node reuses n8n's built-in HTTP credential types (httpBasicAuth, httpHeaderAuth, etc.)
			// which is required for generic HTTP authentication to work in community nodes.
			'@n8n/community-nodes/no-credential-reuse': 'off',
			'n8n-nodes-base/node-class-description-credentials-name-unsuffixed': 'off',
		},
	},
];
