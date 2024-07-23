import { FastifyPluginAsync } from "fastify";
import fs from "fs";
import path from "path";

export async function loadRoutes() {
  const routes: FastifyPluginAsync[] = [];

  // Assuming all route files are .ts files
  const endpointsDir = path.join(__dirname, "./endpoints");
  if (!fs.existsSync(endpointsDir)) {
    return routes;
  }

  const routeFiles = fs
    .readdirSync(endpointsDir)
    .filter((file) => file.endsWith(".ts"));

  for (const file of routeFiles) {
    const routeModule = await import(`./endpoints/${file}`);
    if (routeModule.default && typeof routeModule.default === "function") {
      routes.push(routeModule.default);
    } else {
      console.warn(
        `Module ${file} does not have a default export or is not a function.`
      );
    }
  }

  return routes;
}
