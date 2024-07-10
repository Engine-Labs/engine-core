import path from "path";
import { existsSync, readFileSync } from "fs";
import { PROJECT_DIR } from "../../../../constants";

export async function planBackendFileChanges(
  filepath: string,
  detailedDescription: string
): Promise<string> {
  if (filepath.startsWith(PROJECT_DIR)) {
    filepath = path.relative(PROJECT_DIR, filepath);
  }

  const fullPath = path.join(PROJECT_DIR, filepath);

  const currentFileContentsString = existsSync(fullPath)
    ? `Current file contents:
\`\`\`typescript
${readFileSync(fullPath, "utf8")}
\`\`\``
    : "";

  const prismaSchemaPath = path.join(PROJECT_DIR, "prisma", "schema.prisma");
  const currentPrismaSchemaString = existsSync(prismaSchemaPath)
    ? `Current prisma schema:
\`\`\`prisma
${readFileSync(prismaSchemaPath, "utf8")}
\`\`\``
    : "";

  return `Your current task is to create or edit code in a backend file at ${fullPath} given the following description, existing implementation (if it exists), instructions and examples

Description of changes: ${detailedDescription}

Make sure you provide schemas for all requests and responses.
Do not leave any placeholders in files - code you write is deployed to production immediately. You may use example values instead.

When querying the database in Typescript code:
1. Import the prisma const from the generated client. e.g. \`import { prisma } from "./prismaClient";\`
2. Use it to write Prisma queries.

${currentPrismaSchemaString}

${currentFileContentsString}

### Examples

\`\`\`typescript
// file: src/endpoints/getPosts.ts
import type { FastifyInstance } from "fastify";
import { prisma } from "../prismaClient";

export default async function getPosts(server: FastifyInstance) {
  server.get(
    "/posts",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                title: { type: "string" },
                content: { type: "string" },
                user_id: { type: "string" },
              },
            },
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        const result = await prisma.posts.findMany();
        return reply.status(200).send(result);
      } catch (err) {
        const error = err as Error;
        return reply.status(500).send({ error: error.message });
      }
    }
  );
}
\`\`\`

\`\`\`typescript
// file: src/endpoints/createPost.ts
import type { FastifyInstance } from "fastify";
import { prisma } from "../prismaClient";
import { getUserIdFromRequest } from "../users";

export default async function createPost(server: FastifyInstance) {
  server.post(
    "/posts",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
          },
          required: ["title", "content"],
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "number" },
              title: { type: "string" },
              content: { type: "string" },
              user_id: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const requestBody = request.body as any;
      const userId = await getUserIdFromRequest(request);

      try {
        const result = await prisma.posts.create({
          data: {
            title: requestBody.title,
            content: requestBody.content,
            user_id: userId,
          },
        });
        return reply.status(201).send({
          id: result.id,
          title: requestBody.title,
          content: requestBody.content,
          user_id: userId,
        });
      } catch (err) {
        const error = err as Error;
        reply.status(500).send({ error: error.message });
      }
    }
  );
}
\`\`\`

\`\`\`typescript
// file: src/endpoints/getPost.ts
import type { FastifyInstance } from "fastify";
import { prisma } from "../prismaClient";

export default async function getPost(server: FastifyInstance) {
  server.get(
    "/posts/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "number" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "number" },
              title: { type: "string" },
              content: { type: "string" },
              user_id: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as any;

      try {
        const result = await prisma.posts.findFirst({
          where: {
            id: params.id,
          },
        });

        if (!result) {
          return reply.status(404).send({ error: "Post not found" });
        }
        return reply.status(200).send(result);
      } catch (err) {
        const error = err as Error;
        return reply.status(500).send({ error: error.message });
      }
    }
  );
}
\`\`\`

\`\`\`typescript
// file: src/endpoints/updatePost.ts
import type { FastifyInstance } from "fastify";
import { prisma } from "../prismaClient";
import { getUserIdFromRequest } from "../users";

export default async function updatePost(server: FastifyInstance) {
  server.put(
    "/posts/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "number" },
          },
        },
        body: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "number" },
              title: { type: "string" },
              content: { type: "string" },
              user_id: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const params = request.params as any;
        const requestBody = request.body as any;
        const userId = await getUserIdFromRequest(request);

        const post = await prisma.posts.findFirst({
          where: {
            id: params.id,
            user_id: userId,
          },
        });

        if (post) {
          await prisma.posts.update({
            where: {
              id: params.id,
            },
            data: {
              title: requestBody.title,
              content: requestBody.content,
            },
          });
          reply.status(200).send({
            id: params.id,
            title: requestBody.title,
            content: requestBody.content,
            user_id: userId,
          });
        } else {
          reply
            .status(404)
            .send({ error: "Post not found or no changes made" });
        }
      } catch (error) {
        console.error(error);
        reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
}
\`\`\`

\`\`\`typescript
// file: src/endpoints/deletePost.ts
import type { FastifyInstance } from "fastify";
import { prisma } from "../prismaClient";
import { getUserIdFromRequest } from "../users";

export default async function deletePost(server: FastifyInstance) {
  server.delete(
    "/posts/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "number" },
          },
        },
        response: {
          204: {
            type: "null",
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as any;

      try {
        const userId = await getUserIdFromRequest(request);

        const post = await prisma.posts.findFirst({
          where: {
            id: params.id,
            user_id: userId,
          },
        });
        if (!post) {
          return reply.status(404).send({ error: "Post not found" });
        }

        await prisma.posts.delete({
          where: {
            id: post.id,
          },
        });

        return reply.status(204).send();
      } catch (error) {
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
}
\`\`\``;
}
