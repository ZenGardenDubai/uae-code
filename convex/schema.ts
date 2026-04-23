import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  threads: defineTable({
    sessionId: v.string(),
    title: v.optional(v.string()),
  }).index("by_session", ["sessionId"]),

  messages: defineTable({
    threadId: v.id("threads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    citations: v.optional(
      v.array(
        v.object({
          page: v.number(),
          snippet: v.string(),
          score: v.number(),
        }),
      ),
    ),
  }).index("by_thread", ["threadId"]),
});
