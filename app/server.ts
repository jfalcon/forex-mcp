import type { Server } from 'node:http';
import { OpenAPIV3 } from 'openapi-types';
import cors from 'cors';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { registerHistDataResource } from '@/resources/histdata';
import { closeConnection } from '@/loaders/duckdb';
import { zodToOpenApi } from '@/utils/schema';
import tools from '@/tools';
import pkg from '!/package.json' with { type: 'json' };

const DEFAULT_PORT = 3_000;
const MCP_PORT = Number(process.env.MCP_PORT) || DEFAULT_PORT;

let server: McpServer | undefined;
let httpServer: Server | undefined;

const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    description: pkg.description,
    title: pkg.title,
    version: pkg.version,
  },
  paths: {},
};

export async function startServer(sse = false) {
  if (!server) {
    server = new McpServer({
      name: pkg.name,
      description: pkg.description,
      version: pkg.version,
      title: pkg.title,
    });

    registerHistDataResource(server);

    tools.forEach(t => server?.registerTool(t.name, t.config, t.handler));
  }

  if (sse) {
    const app = createMcpExpressApp({ host: '0.0.0.0' });

    app.use(express.json());

    app.use(cors({
      allowedHeaders: ['Authorization', 'Accept', 'Content-Type', 'Mcp-Session-Id'],
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
    }));

    // a healthcheck route so clients can verify the server is running
    app.get('/', (req, res) => {
      res.json({ status: 'ok', message: 'Forex MCP Server is running' });
    });

    // quick and dirty OpenAPI spec generation
    app.get('/openapi.json', (req, res) => {
      const paths: Record<string, OpenAPIV3.PathItemObject> = {};

      tools.forEach(tool => {
        const raw = tool.config.inputSchema?.toJSONSchema();
        const schema = raw ? zodToOpenApi(raw) : undefined;

        paths[`/tools/${tool.name}`] = {
          post: {
            operationId: tool.name,
            summary: tool.config.description,
            requestBody: {
              content: {
                'application/json': { schema },
              },
            },
            responses: { '200': { description: 'Successful response' } },
          },
        };
      });

      res.json({ ...openApiSpec, paths });
    });


    // define the MCP endpoint
    app.all('/mcp', async (req, res) => {
      const transport = new StreamableHTTPServerTransport();

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Connection', 'keep-alive');

      res.on('close', () => {
        transport.close().catch(() => {});
      });

      await server?.connect(transport);
      await transport.handleRequest(req, res, req.body);
    });

    // do not log to STDOUT, as it may interfere with the MCP communication protocol
    httpServer = app.listen(MCP_PORT, '0.0.0.0', () => {
      console.error(`MCP SSE & Open API Shim Server: http://0.0.0.0:${MCP_PORT}/`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

export async function stopServer() {
  try {
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
    }

    if (server) await server.close();
    closeConnection();
  } catch (err) {
    console.error('Error disconnecting server:', err);
  }
}
