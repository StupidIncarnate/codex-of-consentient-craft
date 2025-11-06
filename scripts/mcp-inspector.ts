/**
 * PURPOSE: Debug script to inspect MCP tool results locally
 *
 * USAGE:
 * npx tsx scripts/mcp-inspector.ts architecture
 * npx tsx scripts/mcp-inspector.ts syntax
 * npx tsx scripts/mcp-inspector.ts folder brokers
 * npx tsx scripts/mcp-inspector.ts discover --path packages/mcp/src/brokers
 * npx tsx scripts/mcp-inspector.ts discover --name architecture-overview-broker
 */

import { architectureOverviewBroker } from "../packages/mcp/src/brokers/architecture/overview/architecture-overview-broker";
import { architectureSyntaxRulesBroker } from "../packages/mcp/src/brokers/architecture/syntax-rules/architecture-syntax-rules-broker";
import { architectureFolderDetailBroker } from "../packages/mcp/src/brokers/architecture/folder-detail/architecture-folder-detail-broker";
import { mcpDiscoverBroker } from "../packages/mcp/src/brokers/mcp/discover/mcp-discover-broker";

const main = async () => {
  const [,, command, ...args] = process.argv;

  try {
    switch (command) {
      case "architecture": {
        const result = await architectureOverviewBroker({});
        process.stdout.write("=== ARCHITECTURE OVERVIEW ===\n\n");
        process.stdout.write(result + "\n");
        break;
      }

      case "syntax": {
        const result = await architectureSyntaxRulesBroker({});
        process.stdout.write("=== SYNTAX RULES ===\n\n");
        process.stdout.write(result + "\n");
        break;
      }

      case "folder": {
        const folderType = args[0];
        if (!folderType) {
          process.stderr.write("Error: folder type required\n");
          process.stderr.write("Usage: npx tsx scripts/mcp-inspector.ts folder <type>\n");
          process.exit(1);
        }
        const result = await architectureFolderDetailBroker({ folderType });
        process.stdout.write(`=== FOLDER DETAIL: ${folderType} ===\n\n`);
        process.stdout.write(result + "\n");
        break;
      }

      case "discover": {
        const pathIndex = args.indexOf("--path");
        const nameIndex = args.indexOf("--name");
        const fileTypeIndex = args.indexOf("--fileType");
        const searchIndex = args.indexOf("--search");

        const path = pathIndex !== -1 ? args[pathIndex + 1] : undefined;
        const name = nameIndex !== -1 ? args[nameIndex + 1] : undefined;
        const fileType = fileTypeIndex !== -1 ? args[fileTypeIndex + 1] : undefined;
        const search = searchIndex !== -1 ? args[searchIndex + 1] : undefined;

        const result = await mcpDiscoverBroker({
          type: "files",
          ...(path && { path }),
          ...(name && { name }),
          ...(fileType && { fileType }),
          ...(search && { search }),
        });

        process.stdout.write("=== DISCOVER RESULTS ===\n\n");
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        break;
      }

      default: {
        process.stdout.write("MCP Inspector - View MCP tool results\n\n");
        process.stdout.write("Commands:\n");
        process.stdout.write("  architecture              - Get architecture overview\n");
        process.stdout.write("  syntax                    - Get universal syntax rules\n");
        process.stdout.write("  folder <type>             - Get folder details (brokers, guards, etc.)\n");
        process.stdout.write("  discover --path <path>    - Browse files in path\n");
        process.stdout.write("  discover --name <name>    - Get file details by name\n");
        process.stdout.write("  discover --fileType <type> - Filter by file type\n");
        process.stdout.write("  discover --search <term>  - Search by keyword\n\n");
        process.stdout.write("Examples:\n");
        process.stdout.write("  npx tsx scripts/mcp-inspector.ts architecture\n");
        process.stdout.write("  npx tsx scripts/mcp-inspector.ts folder brokers\n");
        process.stdout.write("  npx tsx scripts/mcp-inspector.ts discover --path packages/mcp/src\n");
        process.stdout.write("  npx tsx scripts/mcp-inspector.ts discover --name architecture-overview-broker\n");
        break;
      }
    }
  } catch (error) {
    process.stderr.write("Error: " + (error instanceof Error ? error.message : String(error)) + "\n");
    process.exit(1);
  }
};

main();
