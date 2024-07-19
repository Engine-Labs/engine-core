import "dotenv/config";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastify from "fastify";

const LOG_LEVEL = process.env["LOG_LEVEL"] || "info";

const app = fastify({
  logger: {
    level: LOG_LEVEL,
  },
}).withTypeProvider<TypeBoxTypeProvider>();

export default app;
export const logger = app.log;
