import { Client } from "@notionhq/client";
import z from "zod";
import { CreateDatabaseParameters } from "@notionhq/client/build/src/api-endpoints.js";

type NotionDatabaseFieldType = "text" | "number" | "type";

export interface NotionDatabaseProperties {
  title: string;
  properties?: Record<string, NotionDatabaseFieldType>[];
}

type NotionCreateDatabaseOptions = {
  title: [
    {
      type: "text";
      text: {
        content: string;
      };
    }
  ];
  properties: any;
};

export const _constructDatabaseProperties = (
  options: NotionDatabaseProperties
): NotionCreateDatabaseOptions => {
  return {
    title: [
      {
        type: "text",
        text: {
          content: options.title,
        },
      },
    ],
    properties:
      options.properties?.reduce((acc, prop) => {
        const key = Object.keys(prop)[0];
        const value = prop[key];

        return {
          ...acc,
          [key]: {
            type: value,
            [value]: {},
          },
        } as any;
      }, {}) ?? {},
  };
};

export const parseDatabaseProperties = z.object({
  title: z.array(
    z.object({
      type: z.literal("text"),
      text: z.object({
        content: z.string(),
      }),
    })
  ),
  properties: z.record(
    z.string(),
    z.object({
      type: z.union([z.literal("text"), z.literal("number")]),
      text: z.object({}).optional(),
      number: z.object({}).optional(),
    })
  ),
});

export const createDatabase = async ({
  notion,
  databaseId,
  options,
}: {
  notion: Client;
  databaseId: string;
  options: NotionDatabaseProperties;
}) => {
  const props = _constructDatabaseProperties(options);
  const parsedProps = parseDatabaseProperties.parse(props) as any as CreateDatabaseParameters["properties"]
  const body = {
    parent: {
      type: "page_id" as const,
      page_id: databaseId,
    },
    properties: parsedProps,
  };

  return await notion.databases.create(body);
};


export const _constructDatabaseEntryProps = (entry:Record<string, string|number>) => {
  return Object.keys(entry).reduce((acc, key) => {
    const value = entry[key];
    const type = typeof value;

    if(key === "Title"){
      return {
        ...acc,
        [value]: {
          title: [
            {
              type: "text",
              text: {
                content: value,
              },
            },
          ],
        },
      };
    }

    switch (type) {
      case "string":
        return {
          ...acc,
          [key]: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: value,
                },
              },
            ],
          },
        };
      case "number":
        return {
          ...acc,
          [key]: {
            number: value,
          },
        };
      default:
        throw new Error(`Invalid type found: ${type}`);
    }
  }, {});
}

export const populateDatabase = async ({
  notion,
  databaseId,
  entries,
}: {
  notion: Client;
  databaseId: string;
  entries: Record<string, any>[];
}) => {
  // retrieve database 
  const database = await notion.databases.retrieve({ database_id: databaseId });
  const databaseProperties = database.properties;
  const databasePropertiesKeys = Object.keys(databaseProperties);

  // validate entries throw invalid asap
  entries.forEach((entry) => {
    const entryKeys = Object.keys(entry);
    const invalidKeys = entryKeys.filter((key) => !databasePropertiesKeys.includes(key));

    if (invalidKeys.length > 0) {
      throw new Error(`Invalid properties found: ${invalidKeys.join(", ")}`);
    }
  });

  await notion.pages.create({
    parent: { database_id: databaseId },
    properties:{}
  })
};