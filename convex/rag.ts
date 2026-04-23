import { RAG } from "@convex-dev/rag";
import { gateway } from "@ai-sdk/gateway";
import { components } from "./_generated/api";
import { EMBEDDING_DIMENSION, EMBEDDING_MODEL_ID } from "../lib/ai";

export const rag = new RAG(components.rag, {
  textEmbeddingModel: gateway.embeddingModel(EMBEDDING_MODEL_ID),
  embeddingDimension: EMBEDDING_DIMENSION,
});
