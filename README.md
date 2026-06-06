# n8n-nodes-web-request-markdown

This is an [n8n](https://n8n.io/) community node that makes HTTP requests and returns the response as **clean Markdown** instead of raw HTML. It mirrors the parameters of the built-in HTTP Request node but automatically converts the response using [Turndown](https://github.com/mixmark-io/turndown) with GFM support.

This node can also be used as an **AI Agent tool** in n8n's AI workflows, enabling agents to fetch and read web page content as structured Markdown.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Features

- **HTTP Request support** — Supports GET and POST methods with full query parameter, header, and body configuration
- **HTML → Markdown conversion** — Automatically converts HTML responses to clean, readable Markdown
- **Preserves document structure** — Headings (h1–h6), lists, tables, links, images, code blocks, and blockquotes are all preserved
- **Strips metadata** — Removes `<script>`, `<style>`, `<meta>`, `<iframe>`, `<svg>`, and other non-content elements
- **GFM support** — GitHub Flavored Markdown including tables, strikethrough, and task lists
- **AI Agent compatible** — Set `usableAsTool: true` so the node can be used as a tool in n8n AI Agent workflows
- **Authentication support** — Basic Auth, Header Auth, Query Auth, Digest Auth, and OAuth2
- **Configurable conversion** — Customize heading style (ATX/Setext), code block style, bullet markers, link/image inclusion, and navigation stripping

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-web-request-markdown` in the input field
4. Agree to the risks and select **Install**

### Manual Installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-web-request-markdown
```

Then restart n8n.

## Usage

### Basic Usage

1. Add the **Web Request (Markdown)** node to your workflow
2. Set the **URL** you want to fetch
3. Configure the **Method** (defaults to GET)
4. Execute the node — the HTML response is automatically converted to Markdown

### As an AI Agent Tool

1. Add an **AI Agent** node to your workflow
2. In the agent's tools configuration, add the **Web Request (Markdown)** tool
3. The agent can now fetch web pages and receive clean Markdown content for analysis

### Node Parameters

#### Core
| Parameter | Description |
|-----------|-------------|
| Method | HTTP method (GET, POST) |
| URL | The target URL (required) |
| Authentication | None, or Generic Credential Type (Basic, Header, Query, Digest, OAuth2) |

#### Request
| Parameter | Description |
|-----------|-------------|
| Send Query Parameters | Add query string parameters (key-value or JSON) |
| Send Headers | Add custom headers (key-value or JSON) |
| Send Body | Add request body (JSON, form-urlencoded, or raw) |

#### Markdown Options
| Parameter | Default | Description |
|-----------|---------|-------------|
| Heading Style | ATX (`#`) | ATX or Setext style headings |
| Code Block Style | Fenced | Fenced (```) or indented code blocks |
| Bullet List Marker | `-` | Character for unordered lists (`-`, `*`, `+`) |
| Strip Nav & Footer | `true` | Remove `<nav>`, `<footer>`, `<aside>`, `<header>` |
| Include Links | `true` | Keep hyperlinks in output |
| Include Images | `true` | Keep images in output |

#### HTTP Options
| Parameter | Default | Description |
|-----------|---------|-------------|
| Follow Redirects | `true` | Follow HTTP redirects |
| Ignore SSL Issues | `false` | Skip SSL certificate validation |
| Timeout | `30000` | Request timeout in milliseconds |
| Include Response Headers | `false` | Include headers and status in output |

### Output

The node outputs a JSON object per item:

```json
{
  "markdown": "# Page Title\n\nThis is the page content...",
  "url": "https://example.com",
  "statusCode": 200
}
```

With **Include Response Headers** enabled:

```json
{
  "markdown": "# Page Title\n\nThis is the page content...",
  "url": "https://example.com",
  "statusCode": 200,
  "responseHeaders": { "content-type": "text/html; charset=utf-8", ... },
  "contentType": "text/html; charset=utf-8"
}
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Yarn](https://yarnpkg.com/) (modern/Berry, managed via [Corepack](https://nodejs.org/api/corepack.html))

### Setup

```bash
git clone https://github.com/dkhalife/n8n-web-request-markdown.git
cd n8n-web-request-markdown
corepack enable
yarn install
yarn build
```

### Testing Locally with n8n

```bash
# Link the package
cd /path/to/n8n-nodes-web-request-markdown
yarn link

# Link in n8n's custom extensions directory
cd ~/.n8n/custom
yarn link n8n-nodes-web-request-markdown

# Restart n8n
n8n start
```

## Dependencies

| Package | Purpose |
|---------|---------|
| [turndown](https://github.com/mixmark-io/turndown) | HTML to Markdown conversion |
| [turndown-plugin-gfm](https://github.com/mixmark-io/turndown-plugin-gfm) | GFM support (tables, strikethrough, task lists) |
| [cheerio](https://github.com/cheeriojs/cheerio) | HTML parsing and cleanup |

## License

[MIT](LICENSE.md)
