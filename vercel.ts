import { routes, type VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "pnpm build",
  installCommand: "pnpm install --frozen-lockfile",
  headers: [
    routes.cacheControl("/uae-code.pdf", {
      public: true,
      maxAge: "1 week",
      immutable: true,
    }),
  ],
};
