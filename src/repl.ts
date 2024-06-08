import { Client } from "@notionhq/client";
import { config } from "dotenv";
import repl from "repl";

config();

const apiKey: string = process.env.NOTION_API_KEY ?? "";
const pageId: string = process.env.NOTION_PAGE_ID ?? "";

const notion = new Client({ auth: apiKey });

console.log("Notion client and pageId loaded into the REPL environment");

// Start the REPL
const r = repl.start("> ");

// Assign variables to the REPL context
r.context.notion = notion;
r.context.pageId = pageId;
r.context.apiKey = apiKey;

// Add commands to the REPL history
const historyCommands = `
const res = await notion.databases.retrieve({ database_id: "434db104041045299c5f0f35a0d05c60" });
console.log(res);
`;

(async () => {
  try {
    const res = await notion.databases.retrieve({ database_id: "434db104041045299c5f0f35a0d05c60" });
  } catch (error) {
    console.error(error);
  }
})();

r.on('reset', () => {
  r.context.notion = notion;
  r.context.pageId = pageId;
  r.context.apiKey = apiKey;
});

const addHistory = (commands: string, replInstance: repl.REPLServer) => {
  const lines = commands.trim().split('\n');
  lines.forEach((line) => {
    replInstance.write(line + '\n');
  });
};

addHistory(historyCommands, r);
