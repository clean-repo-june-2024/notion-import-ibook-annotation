import { Client } from "@notionhq/client";
import { config } from "dotenv";
import fs from "node:fs";

import uniqBy from "lodash.uniqby";
import {
  CreatePageResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";

const data = JSON.parse(fs.readFileSync("./output.json", "utf8"));

config();

console.log(
  "process.env",
  process.env.NOTION_PAGE_ID,
  process.env.NOTION_API_KEY
);

const pageId = "d5c0a809-1d92-4eea-bb7a-6545f96d563a"; // replace with your actual pageId

const apiKey = process.env.NOTION_API_KEY ?? "";

const notion = new Client({ auth: apiKey });

const progressMapping = (progress: number) => Number(progress.toFixed(3));

async function createBookInDatabase(book, databaseId, pages) {
  const page = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      "Books follow-up": {
        title: [
          {
            type: "text",
            text: {
              content: book.title,
            },
          },
        ],
      },
      Title: {
        rich_text: [
          {
            type: "text",
            text: {
              content: book.title,
            },
          },
        ],
      },
      Author: {
        rich_text: [
          {
            type: "text",
            text: {
              content: book.author,
            },
          },
        ],
      },
      Progress: {
        number: progressMapping(book.bookProgress),
      },
    },
  });

  pages[book.title] = {
    ...book,
    pageId: page.id,
  };
}

async function main() {
  // Create a new database
  const newDatabase = await notion.databases.create({
    parent: {
      type: "page_id",
      page_id: pageId,
    },
    title: [
      {
        type: "text",
        text: {
          content: "Books follow-up",
        },
      },
    ],
    properties: {
      // These properties represent columns in the database (i.e. its schema)
      "Books follow-up": {
        type: "title",
        title: {},
      },
      Author: {
        type: "rich_text",
        rich_text: {},
      },
      Progress: {
        type: "number",
        number: {},
      },
      Title: {
        type: "rich_text",
        rich_text: {},
      },
      Formula: {
        type: "formula",
        formula: {
          expression: ``,
        },
      },
    },
  });

  const databaseId = newDatabase.id;

  const books = uniqBy(data, "title") as any;
  const pages: Record<string, { pageId: string; db?: string }> = {};

  for (const book of books) {
    await createBookInDatabase(book, databaseId, pages);
    const page = pages[book.title];
    const pageId = page.pageId;
    const title = `${book.title} Annotations`;
    const _db = await notion.databases.create({
      parent: {
        type: "page_id",
        page_id: pageId,
      },
      title: [
        {
          type: "text",
          text: {
            content: title
          },
        },
      ],
      properties: {
        // These properties represent columns in the database (i.e. its schema)
        [title]: {
          type: "title",
          title: {},
        },
        Location: {
          type: "rich_text",
          rich_text: {},
        },
        "Highlight text": {
          type: "rich_text",
          rich_text: {},
        },
        Note: {
          type: "rich_text",
          rich_text: {},
        },
        BookPath: {
          type: "rich_text",
          rich_text: {},
        },
        "Color code": {
          type: "rich_text",
          rich_text: {},
        },
      },
    });

    pages[book.title].db = _db.id;
  }

  for (const item of data) {
    const _db = pages[item.title].db;
    const _page = await notion.pages.create({
      parent: { database_id: _db ?? "" },
      properties: {
        Note: {
          rich_text: [
            {
              type: "text",
              text: {
                content: item.quote ?? "",
              },
            },
          ],
        },
        Location: {
          rich_text: [
            {
              type: "text",
              text: {
                content: item.annotationLocation,
              },
            },
          ],
        },
        "Highlight text": {
          rich_text: [
            {
              type: "text",
              text: {
                content: item.annotationText ?? "",
              },
            },
          ],
        },
        BookPath: {
          rich_text: [
            {
              type: "text",
              text: {
                content: item.bookPath,
              },
            },
          ],
        },
        "Color code": {
          rich_text: [
            {
              type: "text",
              text: {
                content: String(item.colorCode),
              },
            },
          ],
        },
        [`${item.title} Annotations`]: {
          title: [
            {
              type: "text",
              text: {
                content: item.annotationText ?? "",
              },
            },
          ],
        },
      },
    });
  }
}

main();
