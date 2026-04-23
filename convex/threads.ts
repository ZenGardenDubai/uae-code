import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalMutation,
  mutation,
  query,
  type ActionCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { rag } from "./rag";
import { rateLimiter } from "./rateLimit";
import { DOCUMENT_NAMESPACE } from "../lib/ai";

export const ensureThread = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }): Promise<Id<"threads">> => {
    const existing = await ctx.db
      .query("threads")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("threads", { sessionId });
  },
});

export const listMessages = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, { threadId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("asc")
      .take(200);
  },
});

export const saveUserMessage = internalMutation({
  args: {
    threadId: v.id("threads"),
    content: v.string(),
  },
  handler: async (ctx, { threadId, content }): Promise<Id<"messages">> => {
    return await ctx.db.insert("messages", {
      threadId,
      role: "user",
      content,
    });
  },
});

export const saveAssistantMessage = internalMutation({
  args: {
    threadId: v.id("threads"),
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
  },
  handler: async (ctx, args): Promise<Id<"messages">> => {
    return await ctx.db.insert("messages", {
      threadId: args.threadId,
      role: "assistant",
      content: args.content,
      citations: args.citations,
    });
  },
});

const MAX_PROMPT_CHARS = 1000;
const RETRIEVAL_LIMIT = 6;
const SNIPPET_CHARS = 500;

export const retrieveContext = action({
  args: {
    threadId: v.id("threads"),
    sessionId: v.string(),
    prompt: v.string(),
  },
  handler: async (
    ctx: ActionCtx,
    { threadId, sessionId, prompt },
  ): Promise<{
    contextText: string;
    citations: Array<{ page: number; snippet: string; score: number }>;
    userMessageId: Id<"messages">;
  }> => {
    if (prompt.trim().length === 0) {
      throw new Error("EMPTY_PROMPT");
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      throw new Error("PROMPT_TOO_LONG");
    }

    const hourly = await rateLimiter.limit(ctx, "askPerHour", {
      key: sessionId,
    });
    if (!hourly.ok) {
      throw new Error(`RATE_LIMITED:hour:${Math.ceil(hourly.retryAfter / 1000)}`);
    }
    const daily = await rateLimiter.limit(ctx, "askPerDay", { key: sessionId });
    if (!daily.ok) {
      throw new Error(`RATE_LIMITED:day:${Math.ceil(daily.retryAfter / 1000)}`);
    }

    const userMessageId: Id<"messages"> = await ctx.runMutation(
      internal.threads.saveUserMessage,
      { threadId, content: prompt },
    );

    const { results, text } = await rag.search(ctx, {
      namespace: DOCUMENT_NAMESPACE,
      query: prompt,
      limit: RETRIEVAL_LIMIT,
      chunkContext: { before: 1, after: 1 },
      vectorScoreThreshold: 0.3,
    });

    const citations = results
      .map((r) => {
        const matchedIdx = Math.max(0, r.order - r.startOrder);
        const matched = r.content[matchedIdx] ?? r.content[0];
        const page = (matched?.metadata as { page?: number } | undefined)
          ?.page;
        if (typeof page !== "number") return null;
        const combined = r.content.map((c) => c.text).join("\n");
        return {
          page,
          snippet: combined.slice(0, SNIPPET_CHARS),
          score: r.score,
        };
      })
      .filter((c): c is { page: number; snippet: string; score: number } =>
        c !== null,
      );

    return { contextText: text, citations, userMessageId };
  },
});
