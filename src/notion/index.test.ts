import { describe, expect, it } from "vitest";
import {
  NotionDatabaseProperties,
  _constructDatabaseEntryProps,
  _constructDatabaseProperties,
  populateDatabase,
} from "./index.ts";
import { databaseRetrivalMock } from "./mocks/index.ts";

describe("_constructDatabaseProperties", () => {
  it("should construct database properties", () => {
    const options: NotionDatabaseProperties = {
      title: "Test",
      properties: [{ key1: "text" }, { key2: "number" }],
    };

    const result = _constructDatabaseProperties(options);

    expect(result).toEqual({
      title: [
        {
          type: "text",
          text: {
            content: "Test",
          },
        },
      ],
      properties: {
        key1: {
          type: "text",
          text: {},
        },
        key2: {
          type: "number",
          number: {},
        },
      },
    });
  });
});

// describe("createDatabase", () => {});

describe("populating database", () => {
  describe("_constructDatabaseEntryProps", () => {
    it.only("should construct database entry properties", () => {
      const entry =  {
        Title: "Some Title",
        Author: "Uncle Bob",
        TimeSpent: 0.1,
      }

      const expected = {
        "Some Title": {
          title: [
            {
              type: "text",
              text: {
                content: "Some Title",
              },
            },
          ]
        },
        Author: {
          rich_text: [
            {
              type: "text",
              text: {
                content: "Uncle Bob",
              },
            },
          ],
        },
        TimeSpent: {
          number: 0.1,
        },
      }

      const result = _constructDatabaseEntryProps(entry);
      expect(result).toEqual(expected);
    })
  });
  describe("populateDatabase", () => {
    it("should throw if entries have invalid properties", async() => {
      const client = {
        databases: {
          retrieve: () => Promise.resolve(databaseRetrivalMock),
        },
      } as any;
  
      expect(async() =>
        await populateDatabase({
          notion: client,
          databaseId: "123",
          entries: [
            {
              Title: "Some Title",
              Author: "Uncle Bob",
              TimeSpent: 0.1,
            },
          ],
        })
      ).rejects.toThrowError("Invalid properties found: TimeSpent");
    });
  
    it("")
  })
});
