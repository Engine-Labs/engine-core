import cors from "@fastify/cors";
import fastifySwagger, { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import app from "./app";
import { loadRoutes } from "./routes";

const port = parseInt(process.env.PORT || "8888");
const host = "::";

const apiUrl = process.env.API_URL || `http://0.0.0.0:${port}`;

export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: "Interactive API",
      version: "0.1.0",
    },
    servers: [
      {
        url: apiUrl,
      },
    ],
  },
};
export const swaggerUiOptions = {
  routePrefix: "/api/docs",
  exposeRoute: true,
};

export async function setupAndRun() {
  app.register(fastifySwagger, swaggerOptions);
  app.register(fastifySwaggerUi, swaggerUiOptions);

  await app.register(cors, {
    origin: ["*"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  });

  const routes = await loadRoutes();
  for (const route of routes) {
    app.register(route, { prefix: "/api" });
  }

  app.listen({ host: host, port: port }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
}

setupAndRun();
