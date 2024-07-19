import type { FastifyInstance } from "fastify";

export default async function healthcheck(server: FastifyInstance) {
  server.get("/healthcheck", async (_request, reply) => {
    reply.code(200).send({
      status: "ok",
      uptime: process.uptime(),
    });
  });
}
