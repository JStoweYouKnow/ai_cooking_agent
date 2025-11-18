import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
// Note: vite.config.ts removed - using Next.js now
// This file is kept for backward compatibility but may not be used
// vite is dynamically imported to avoid build errors in Next.js
const viteConfig = {} as any;

// Minimal type definition for vite module to avoid requiring vite to be installed during Next.js builds
interface ViteModule {
  createServer: (options: {
    configFile?: boolean;
    server?: {
      middlewareMode?: boolean;
      hmr?: { server: Server };
      allowedHosts?: boolean | string[];
    };
    appType?: "custom" | "spa" | "mpa";
    [key: string]: unknown;
  }) => Promise<{
    middlewares: express.RequestHandler;
    transformIndexHtml: (url: string, html: string) => Promise<string>;
    ssrFixStacktrace: (error: Error) => void;
  }>;
}

export async function setupVite(app: Express, server: Server) {
  // Dynamic import to avoid build errors in Next.js where vite is not available
  let viteModule: ViteModule;
  try {
    viteModule = await import("vite") as unknown as ViteModule;
  } catch (error) {
    throw new Error(
      "vite is required for setupVite but is not installed. " +
      "This function is only needed for the standalone Express server, not Next.js."
    );
  }

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await viteModule.createServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
