import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

export class WebRequestMarkdown implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Web Request (Markdown)',
		name: 'webRequestMarkdown',
		icon: { light: 'file:webrequestmarkdown.svg', dark: 'file:webrequestmarkdown.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["method"] + ": " + $parameter["url"]}}',
		description:
			'Makes an HTTP request and returns the response as clean Markdown instead of raw HTML',
		defaults: {
			name: 'Web Request (Markdown)',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'httpBasicAuth',
				displayOptions: {
					show: {
						authentication: ['genericCredentialType'],
						genericAuthType: ['httpBasicAuth'],
					},
				},
			},
			{
				name: 'httpHeaderAuth',
				displayOptions: {
					show: {
						authentication: ['genericCredentialType'],
						genericAuthType: ['httpHeaderAuth'],
					},
				},
			},
			{
				name: 'httpQueryAuth',
				displayOptions: {
					show: {
						authentication: ['genericCredentialType'],
						genericAuthType: ['httpQueryAuth'],
					},
				},
			},
			{
				name: 'httpDigestAuth',
				displayOptions: {
					show: {
						authentication: ['genericCredentialType'],
						genericAuthType: ['httpDigestAuth'],
					},
				},
			},
			{
				name: 'oAuth2Api',
				displayOptions: {
					show: {
						authentication: ['genericCredentialType'],
						genericAuthType: ['oAuth2Api'],
					},
				},
			},
		],
		properties: [
			// --- Core Parameters ---
			{
				displayName: 'Method',
				name: 'method',
				type: 'options',
				options: [
					{ name: 'DELETE', value: 'DELETE' },
					{ name: 'GET', value: 'GET' },
					{ name: 'HEAD', value: 'HEAD' },
					{ name: 'OPTIONS', value: 'OPTIONS' },
					{ name: 'PATCH', value: 'PATCH' },
					{ name: 'POST', value: 'POST' },
					{ name: 'PUT', value: 'PUT' },
				],
				default: 'GET',
				description: 'The request method to use',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://example.com',
				description: 'The URL to make the request to',
				required: true,
			},
			{
				displayName: 'Authentication',
				name: 'authentication',
				noDataExpression: true,
				type: 'options',
				options: [
					{ name: 'None', value: 'none' },
					{
						name: 'Generic Credential Type',
						value: 'genericCredentialType',
						description: 'Fully customizable. Choose between basic, header, OAuth2, etc.',
					},
				],
				default: 'none',
			},
			{
				displayName: 'Generic Auth Type',
				name: 'genericAuthType',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						authentication: ['genericCredentialType'],
					},
				},
				options: [
					{ name: 'Basic Auth', value: 'httpBasicAuth' },
					{ name: 'Digest Auth', value: 'httpDigestAuth' },
					{ name: 'Header Auth', value: 'httpHeaderAuth' },
					{ name: 'OAuth2', value: 'oAuth2Api' },
					{ name: 'Query Auth', value: 'httpQueryAuth' },
				],
				default: 'httpBasicAuth',
			},

			// --- Query Parameters ---
			{
				displayName: 'Send Query Parameters',
				name: 'sendQuery',
				type: 'boolean',
				default: false,
				noDataExpression: true,
				description: 'Whether the request has query params or not',
			},
			{
				displayName: 'Specify Query Parameters',
				name: 'specifyQuery',
				type: 'options',
				displayOptions: { show: { sendQuery: [true] } },
				options: [
					{ name: 'Using Fields Below', value: 'keypair' },
					{ name: 'Using JSON', value: 'json' },
				],
				default: 'keypair',
			},
			{
				displayName: 'Query Parameters',
				name: 'queryParameters',
				type: 'fixedCollection',
				displayOptions: { show: { sendQuery: [true], specifyQuery: ['keypair'] } },
				typeOptions: { multipleValues: true },
				placeholder: 'Add Query Parameter',
				default: { parameters: [{ name: '', value: '' }] },
				options: [
					{
						name: 'parameters',
						displayName: 'Query Parameter',
						values: [
							{ displayName: 'Name', name: 'name', type: 'string', default: '' },
							{ displayName: 'Value', name: 'value', type: 'string', default: '' },
						],
					},
				],
			},
			{
				displayName: 'JSON',
				name: 'jsonQuery',
				type: 'json',
				displayOptions: { show: { sendQuery: [true], specifyQuery: ['json'] } },
				default: '',
			},

			// --- Headers ---
			{
				displayName: 'Send Headers',
				name: 'sendHeaders',
				type: 'boolean',
				default: false,
				noDataExpression: true,
				description: 'Whether the request has headers or not',
			},
			{
				displayName: 'Specify Headers',
				name: 'specifyHeaders',
				type: 'options',
				displayOptions: { show: { sendHeaders: [true] } },
				options: [
					{ name: 'Using Fields Below', value: 'keypair' },
					{ name: 'Using JSON', value: 'json' },
				],
				default: 'keypair',
			},
			{
				displayName: 'Headers',
				name: 'headerParameters',
				type: 'fixedCollection',
				displayOptions: { show: { sendHeaders: [true], specifyHeaders: ['keypair'] } },
				typeOptions: { multipleValues: true },
				placeholder: 'Add Header',
				default: { parameters: [{ name: '', value: '' }] },
				options: [
					{
						name: 'parameters',
						displayName: 'Header',
						values: [
							{ displayName: 'Name', name: 'name', type: 'string', default: '' },
							{ displayName: 'Value', name: 'value', type: 'string', default: '' },
						],
					},
				],
			},
			{
				displayName: 'JSON',
				name: 'jsonHeaders',
				type: 'json',
				displayOptions: { show: { sendHeaders: [true], specifyHeaders: ['json'] } },
				default: '',
			},

			// --- Body ---
			{
				displayName: 'Send Body',
				name: 'sendBody',
				type: 'boolean',
				default: false,
				noDataExpression: true,
				description: 'Whether the request has a body or not',
			},
			{
				displayName: 'Body Content Type',
				name: 'contentType',
				type: 'options',
				displayOptions: { show: { sendBody: [true] } },
				options: [
					{ name: 'Form Urlencoded', value: 'form-urlencoded' },
					{ name: 'JSON', value: 'json' },
					{ name: 'Raw', value: 'raw' },
				],
				default: 'json',
				description: 'Content-Type to use to send body parameters',
			},
			{
				displayName: 'Specify Body',
				name: 'specifyBody',
				type: 'options',
				displayOptions: { show: { sendBody: [true], contentType: ['json'] } },
				options: [
					{ name: 'Using Fields Below', value: 'keypair' },
					{ name: 'Using JSON', value: 'json' },
				],
				default: 'keypair',
			},
			{
				displayName: 'Body Parameters',
				name: 'bodyParameters',
				type: 'fixedCollection',
				displayOptions: { show: { sendBody: [true], contentType: ['json'], specifyBody: ['keypair'] } },
				typeOptions: { multipleValues: true },
				placeholder: 'Add Body Field',
				default: { parameters: [{ name: '', value: '' }] },
				options: [
					{
						name: 'parameters',
						displayName: 'Body Field',
						values: [
							{ displayName: 'Name', name: 'name', type: 'string', default: '' },
							{ displayName: 'Value', name: 'value', type: 'string', default: '' },
						],
					},
				],
			},
			{
				displayName: 'JSON Body',
				name: 'jsonBody',
				type: 'json',
				displayOptions: { show: { sendBody: [true], contentType: ['json'], specifyBody: ['json'] } },
				default: '',
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				displayOptions: { show: { sendBody: [true], contentType: ['raw'] } },
				default: '',
				placeholder: '',
			},
			{
				displayName: 'Content Type',
				name: 'rawContentType',
				type: 'string',
				displayOptions: { show: { sendBody: [true], contentType: ['raw'] } },
				default: 'text/html',
				placeholder: 'text/html',
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				displayOptions: { show: { sendBody: [true], contentType: ['form-urlencoded'] } },
				default: '',
				placeholder: 'field1=value1&field2=value2',
			},

			// --- Markdown Conversion Options ---
			{
				displayName: 'Markdown Options',
				name: 'markdownOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Bullet List Marker',
						name: 'bulletListMarker',
						type: 'options',
						options: [
							{ name: 'Dash (-)', value: '-' },
							{ name: 'Asterisk [All]', value: '*' },
							{ name: 'Plus (+)', value: '+' },
						],
						default: '-',
						description: 'Character used for unordered list items',
					},
					{
						displayName: 'Code Block Style',
						name: 'codeBlockStyle',
						type: 'options',
						options: [
							{ name: 'Fenced (```)', value: 'fenced' },
							{ name: 'Indented', value: 'indented' },
						],
						default: 'fenced',
						description: 'Style used for converting code blocks',
					},
					{
						displayName: 'Heading Style',
						name: 'headingStyle',
						type: 'options',
						options: [
							{ name: 'ATX (# Heading)', value: 'atx' },
							{ name: 'Setext (Underlined)', value: 'setext' },
						],
						default: 'atx',
						description: 'Style used for converting headings',
					},
					{
						displayName: 'Include Images',
						name: 'includeImages',
						type: 'boolean',
						default: true,
						description: 'Whether to keep images in the Markdown output',
					},
					{
						displayName: 'Include Links',
						name: 'includeLinks',
						type: 'boolean',
						default: true,
						description: 'Whether to keep hyperlinks in the Markdown output',
					},
					{
						displayName: 'Strip Navigation & Footer',
						name: 'stripNavFooter',
						type: 'boolean',
						default: true,
						description:
							'Whether to remove &lt;nav&gt;, &lt;footer&gt;, &lt;aside&gt;, and &lt;header&gt; elements from the HTML before conversion',
					},
				],
			},

			// --- HTTP Options ---
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Follow Redirects',
						name: 'followRedirects',
						type: 'boolean',
						default: true,
						description: 'Whether to follow all redirects',
					},
					{
						displayName: 'Ignore SSL Issues (Insecure)',
						name: 'allowUnauthorizedCerts',
						type: 'boolean',
						default: false,
						description:
							'Whether to connect even if SSL certificate validation is not possible',
					},
					{
						displayName: 'Include Response Headers',
						name: 'fullResponse',
						type: 'boolean',
						default: false,
						description:
							'Whether to include the full response (headers and status code) in the output',
					},
					{
						displayName: 'Timeout',
						name: 'timeout',
						type: 'number',
						default: 30000,
						description: 'Time in milliseconds to wait for the server to send a response before aborting the request',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const method = this.getNodeParameter('method', itemIndex, 'GET') as IHttpRequestMethods;
				const url = this.getNodeParameter('url', itemIndex, '') as string;

				if (!url) {
					throw new NodeOperationError(this.getNode(), 'The URL parameter is required', {
						itemIndex,
					});
				}

				const authentication = this.getNodeParameter('authentication', itemIndex, 'none') as string;
				const sendQuery = this.getNodeParameter('sendQuery', itemIndex, false) as boolean;
				const sendHeaders = this.getNodeParameter('sendHeaders', itemIndex, false) as boolean;
				const sendBody = this.getNodeParameter('sendBody', itemIndex, false) as boolean;
				const markdownOptions = this.getNodeParameter('markdownOptions', itemIndex, {}) as IDataObject;
				const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

				// Build request options
				const requestOptions: IHttpRequestOptions = {
					method,
					url,
					returnFullResponse: true,
					ignoreHttpStatusErrors: true,
				};

				// Query parameters
				if (sendQuery) {
					const specifyQuery = this.getNodeParameter('specifyQuery', itemIndex, 'keypair') as string;
					if (specifyQuery === 'keypair') {
						const queryParameters = this.getNodeParameter(
							'queryParameters.parameters',
							itemIndex,
							[],
						) as Array<{ name: string; value: string }>;
						const qs: IDataObject = {};
						for (const param of queryParameters) {
							if (param.name) {
								qs[param.name] = param.value;
							}
						}
						requestOptions.qs = qs;
					} else {
						const jsonQuery = this.getNodeParameter('jsonQuery', itemIndex, '{}') as string;
						try {
							requestOptions.qs = JSON.parse(jsonQuery);
						} catch {
							throw new NodeOperationError(
								this.getNode(),
								'The JSON query parameters are not valid JSON',
								{ itemIndex },
							);
						}
					}
				}

				// Headers
				const headers: Record<string, string> = {};
				if (sendHeaders) {
					const specifyHeaders = this.getNodeParameter(
						'specifyHeaders',
						itemIndex,
						'keypair',
					) as string;
					if (specifyHeaders === 'keypair') {
						const headerParameters = this.getNodeParameter(
							'headerParameters.parameters',
							itemIndex,
							[],
						) as Array<{ name: string; value: string }>;
						for (const param of headerParameters) {
							if (param.name) {
								headers[param.name] = param.value;
							}
						}
					} else {
						const jsonHeaders = this.getNodeParameter('jsonHeaders', itemIndex, '{}') as string;
						try {
							Object.assign(headers, JSON.parse(jsonHeaders));
						} catch {
							throw new NodeOperationError(
								this.getNode(),
								'The JSON headers are not valid JSON',
								{ itemIndex },
							);
						}
					}
				}
				requestOptions.headers = headers;

				// Body
				if (sendBody) {
					const contentType = this.getNodeParameter('contentType', itemIndex, 'json') as string;

					if (contentType === 'json') {
						const specifyBody = this.getNodeParameter(
							'specifyBody',
							itemIndex,
							'keypair',
						) as string;
						if (specifyBody === 'keypair') {
							const bodyParameters = this.getNodeParameter(
								'bodyParameters.parameters',
								itemIndex,
								[],
							) as Array<{ name: string; value: string }>;
							const bodyObj: IDataObject = {};
							for (const param of bodyParameters) {
								if (param.name) {
									bodyObj[param.name] = param.value;
								}
							}
							requestOptions.body = bodyObj;
							requestOptions.json = true;
						} else {
							const jsonBody = this.getNodeParameter('jsonBody', itemIndex, '{}') as string;
							try {
								requestOptions.body = JSON.parse(jsonBody);
								requestOptions.json = true;
							} catch {
								throw new NodeOperationError(
									this.getNode(),
									'The JSON body is not valid JSON',
									{ itemIndex },
								);
							}
						}
					} else if (contentType === 'raw') {
						const rawBody = this.getNodeParameter('body', itemIndex, '') as string;
						const rawContentType = this.getNodeParameter(
							'rawContentType',
							itemIndex,
							'text/html',
						) as string;
						requestOptions.body = rawBody;
						headers['Content-Type'] = rawContentType;
					} else if (contentType === 'form-urlencoded') {
						const formBody = this.getNodeParameter('body', itemIndex, '') as string;
						requestOptions.body = formBody;
						headers['Content-Type'] = 'application/x-www-form-urlencoded';
					}
				}

				// HTTP Options
				const followRedirects = options.followRedirects !== undefined ? options.followRedirects : true;
				if (!followRedirects) {
					requestOptions.disableFollowRedirect = true;
				}
				if (options.allowUnauthorizedCerts) {
					requestOptions.skipSslCertificateValidation = true;
				}
				if (options.timeout) {
					requestOptions.timeout = options.timeout as number;
				}

				// Make the HTTP request
				let response;
				if (authentication === 'genericCredentialType') {
					const genericAuthType = this.getNodeParameter(
						'genericAuthType',
						itemIndex,
						'httpBasicAuth',
					) as string;
					response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						genericAuthType,
						requestOptions,
					);
				} else {
					response = await this.helpers.httpRequest(requestOptions);
				}

				// Parse response
				let responseBody: string;
				let statusCode: number;
				let responseHeaders: IDataObject = {};

				if (typeof response === 'object' && response !== null && 'body' in response) {
					responseBody = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
					statusCode = (response.statusCode as number) || 200;
					responseHeaders = (response.headers as IDataObject) || {};
				} else {
					responseBody = typeof response === 'string' ? response : JSON.stringify(response);
					statusCode = 200;
				}

				// Convert HTML to Markdown
				const markdown = convertHtmlToMarkdown(responseBody, markdownOptions);

				// Build output
				const outputItem: IDataObject = {
					markdown,
					url,
					statusCode,
				};

				if (options.fullResponse) {
					outputItem.responseHeaders = responseHeaders;
					outputItem.contentType =
						(responseHeaders['content-type'] as string) ||
						(responseHeaders['Content-Type'] as string) ||
						'';
				}

				returnData.push({ json: outputItem });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: itemIndex,
					});
				} else {
					if ((error as NodeOperationError).context) {
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
				}
			}
		}

		return [returnData];
	}
}

function convertHtmlToMarkdown(html: string, options: IDataObject): string {
	const stripNavFooter = options.stripNavFooter !== undefined ? (options.stripNavFooter as boolean) : true;
	const includeLinks = options.includeLinks !== undefined ? (options.includeLinks as boolean) : true;
	const includeImages = options.includeImages !== undefined ? (options.includeImages as boolean) : true;
	const headingStyle = (options.headingStyle as string) || 'atx';
	const codeBlockStyle = (options.codeBlockStyle as string) || 'fenced';
	const bulletListMarker = (options.bulletListMarker as string) || '-';

	// Step 1: Parse and clean HTML with cheerio
	const $ = cheerio.load(html);

	// Remove metadata and non-content elements
	$('script').remove();
	$('style').remove();
	$('link[rel="stylesheet"]').remove();
	$('meta').remove();
	$('noscript').remove();
	$('iframe').remove();
	$('svg').remove();
	$('form').remove();

	// Optionally strip navigation, footer, aside, header
	if (stripNavFooter) {
		$('nav').remove();
		$('footer').remove();
		$('aside').remove();
		$('header').remove();
	}

	// Remove hidden elements
	$('[style*="display:none"]').remove();
	$('[style*="display: none"]').remove();
	$('[hidden]').remove();
	$('[aria-hidden="true"]').remove();

	// Get cleaned HTML body content
	const cleanedHtml = $('body').html() || $.html();

	// Step 2: Convert to Markdown with Turndown
	const turndownService = new TurndownService({
		headingStyle: headingStyle as 'atx' | 'setext',
		codeBlockStyle: codeBlockStyle as 'fenced' | 'indented',
		bulletListMarker: bulletListMarker as '-' | '*' | '+',
		emDelimiter: '_',
		strongDelimiter: '**',
		hr: '---',
	});

	// Enable GFM plugin (tables, strikethrough, task lists)
	turndownService.use(gfm);

	// Handle links based on configuration
	if (!includeLinks) {
		turndownService.addRule('removeLinks', {
			filter: 'a',
			replacement: (content) => {
				return content;
			},
		});
	}

	// Handle images based on configuration
	if (!includeImages) {
		turndownService.addRule('removeImages', {
			filter: 'img',
			replacement: () => '',
		});
	}

	// Remove empty links and clean up common patterns
	turndownService.addRule('cleanEmptyLinks', {
		filter: (node) => {
			return (
				node.nodeName === 'A' &&
				(!node.textContent || node.textContent.trim() === '')
			);
		},
		replacement: () => '',
	});

	let markdown = turndownService.turndown(cleanedHtml);

	// Step 3: Post-process — clean up excessive whitespace
	markdown = markdown
		.replace(/\n{3,}/g, '\n\n') // Collapse 3+ newlines to 2
		.replace(/^\s+/gm, (match) => {
			// Preserve intentional indentation (lists) but remove excessive leading whitespace
			if (match.length > 8) return '    ';
			return match;
		})
		.trim();

	return markdown;
}
