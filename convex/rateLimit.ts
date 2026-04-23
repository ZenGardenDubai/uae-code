import { RateLimiter, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

const DAY = 24 * HOUR;

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  askPerHour: { kind: "fixed window", rate: 30, period: HOUR },
  askPerDay: { kind: "fixed window", rate: 200, period: DAY },
});
