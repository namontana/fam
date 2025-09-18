# Copilot Instructions

## Project Overview
This is a **Model Context Protocol (MCP) server** named "fam" built with TypeScript and the `@modelcontextprotocol/sdk`. The project provides tools for interacting with external APIs through the MCP framework, specifically focusing on BMLT (Basic Meeting List Toolbox) integration.

## Architecture Patterns

### MCP Server Structure
- **Entry point**: `src/index.ts` - Sets up the MCP server with stdio transport and auto-loads tools
- **Server configuration**: Uses `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
- **Transport**: `StdioServerTransport` for stdio communication
- **Constants**: `BMLT_API_BASE` points to `https://bmlt.mtrna.org/prod` for external API integration

### Tool Implementation Pattern
- **Base interface**: `src/tools/base-tool.ts` defines the `Tool` interface and `BaseTool` abstract class
- **Tool classes**: Extend `BaseTool` (see `src/tools/bmlt-client.ts`)
- **Tool callback signature**: `async (params: Record<string, any>) => Promise<McpResponse>`
- **Auto-discovery**: `src/tools.ts` automatically scans and loads all tool classes from the `tools/` directory

### Code Conventions
- **ES Modules**: Uses `"type": "module"` in package.json with Node16 module resolution
- **TypeScript config**: Targets ES2022, outputs to `./build` directory
- **Import style**: Relative imports from local modules, explicit `.js` extensions for SDK imports
- **Tool arguments**: Use Zod schemas for parameter validation and description
- **Error handling**: Tool callbacks return structured error responses with `type: "text"` content

## Development Workflow

### Build Process
```bash
npm run build  # Compiles TypeScript and makes index.js executable
```

### Adding New Tools
1. Create a new class in `src/tools/` that extends `BaseTool`
2. Implement required properties: `name`, `description`, `args`, `callback`
3. Use Zod schemas for parameter validation in `args`
4. Return proper `McpResponse` objects from `callback`
5. Build - tools are automatically discovered and registered

### Project Structure
```
src/
├── index.ts          # MCP server entry point with auto tool loading
├── tools.ts          # Tool discovery and loading system
└── tools/
    ├── base-tool.ts   # Tool interface and base class
    └── bmlt-client.ts # BMLT API client tool
```

## Key Implementation Details

### MCP Response Format
Tools must return objects matching this structure:
```typescript
{
  content: [
    {
      type: "text",
      text: "response content",
      [key: string]: unknown  // MCP allows additional properties
    }
  ],
  [key: string]: unknown  // MCP allows additional properties
}
```

### Tool Schema Pattern
```typescript
args: ToolArgs = {
  paramName: z.string().optional().describe("Parameter description"),
  numParam: z.number().min(1).max(10).describe("Number with constraints")
}
```

### External API Integration
- Uses constant `USER_AGENT = "fam/" + SERVER_VERSION` for API requests
- API base URLs stored as constants (e.g., `BMLT_API_BASE`)
- Tools handle API failures by returning error content objects
- BMLT client supports location search, weekday filtering, and format filtering

### Tool Auto-Loading System
- `loadTools()` scans the `tools/` directory for `.js` files (excluding `base-tool.js`)
- Instantiates exported classes and validates they implement the `Tool` interface
- Registers tools with MCP server using `server.tool()` method
- Automatic Zod schema conversion for parameter validation