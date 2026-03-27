import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { def as addJobDef, handler as addJobHandler } from "./tools/add-job";
import { def as listJobsDef, handler as listJobsHandler } from "./tools/list-jobs";
import { def as updateJobDef, handler as updateJobHandler } from "./tools/update-job";
import { def as findJobDef, handler as findJobHandler } from "./tools/find-job";
import { def as addTagsDef, handler as addTagsHandler } from "./tools/add-tags";
import { def as getStatsDef, handler as getStatsHandler } from "./tools/get-stats";

const server = new McpServer({
  name: "huntly",
  version: "0.0.1",
});

server.tool(addJobDef.name, addJobDef.description, addJobDef.schema, addJobHandler);
server.tool(listJobsDef.name, listJobsDef.description, listJobsDef.schema, listJobsHandler);
server.tool(updateJobDef.name, updateJobDef.description, updateJobDef.schema, updateJobHandler);
server.tool(findJobDef.name, findJobDef.description, findJobDef.schema, findJobHandler);
server.tool(addTagsDef.name, addTagsDef.description, addTagsDef.schema, addTagsHandler);
server.tool(getStatsDef.name, getStatsDef.description, getStatsDef.schema, getStatsHandler);

const transport = new StdioServerTransport();
await server.connect(transport);
