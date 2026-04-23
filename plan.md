# UAE-CODE — RAG Chat App

Project name: **UAE-CODE** (slug: `uae-code`).

Full Arabic title of the source document:
**كود الإمارات للخدمات الحكومية وتصفير البيروقراطية**
(_"The UAE Code for Government Services and Zero Bureaucracy"_)

A public, Arabic-first chat interface over this 75-page PDF, built on Next.js + Convex with the `@convex-dev/rag` component, deployed on Vercel.

Repo: https://github.com/ZenGardenDubai/uae-code

---

## 1. Decisions locked in

| Topic | Choice |
|---|---|
| Document scope | Single PDF, ingested once via seed script |
| Authentication | Public, no login (rate-limited by IP) |
| AI provider | Vercel AI Gateway (one key, multi-provider) |
| Embeddings | `cohere/embed-multilingual-v3.0` (1024-dim) |
| Generation | `anthropic/claude-sonnet-4-6` |
| UI language | Arabic-only, RTL |
| Bot response language | Always Arabic |
| Design system | `@aegov/design-system-react` (UAE DS) |
| Arabic headings font | **Alexandria** (Google Fonts — UAE DS spec) |
| Arabic body font | **Noto Kufi Arabic** (Google Fonts — UAE DS spec) |
| Deployment | Vercel (app) + Convex Cloud (backend) |

## 2. Tech stack

- **Next.js 16** (App Router, Turbopack)
- **Convex** (functions + DB)
- **`@convex-dev/rag`** component
- **`@convex-dev/rate-limiter`** component
- **`@aegov/design-system-react`** + **TailwindCSS**
- **Vercel AI SDK v6** (`streamText`, `useChat`)
- **Vercel AI Gateway** (unified provider routing)
- **Node.js 24 LTS**
- **pnpm**

## 3. Architecture

```
User (AR browser, RTL)
   │
   ▼
Next.js 16 App Router  ──►  Vercel AI SDK (useChat, streaming)
                                  │
                                  ▼
                         Vercel AI Gateway
                           │         │
                           │         └──► Cohere embed-multilingual-v3.0 (embeddings, Arabic-strong)
                           ▼
                   Anthropic Claude Sonnet 4.6 (generation)
                                  ▲
                                  │  retrieved chunks + page citations
                                  │
                         Convex (functions + DB)
                                  │
                                  ▼
                     @convex-dev/rag component
                      (chunking, embedding, vector search)
```

## 4. Project layout

```
uae-code/
├── app/
│   ├── layout.tsx              # <html lang="ar" dir="rtl">, font setup
│   ├── page.tsx                # Chat page (single screen)
│   ├── globals.css             # Tailwind + UAE DS + RTL tweaks
│   └── api/chat/route.ts       # streams from Convex via AI SDK
├── components/
│   ├── chat/
│   │   ├── chat-panel.tsx
│   │   ├── message-bubble.tsx
│   │   ├── citation-chip.tsx   # "صفحة 42"
│   │   ├── source-drawer.tsx   # retrieved Arabic chunks
│   │   └── composer.tsx
│   ├── layout/
│   │   ├── app-header.tsx      # UAE DS header w/ emblem
│   │   └── app-footer.tsx
│   └── ui/                     # thin wrappers over @aegov/design-system-react
├── convex/
│   ├── schema.ts
│   ├── convex.config.ts        # registers rag + rateLimiter
│   ├── rag.ts                  # ask() action: retrieve + stream
│   ├── threads.ts              # anonymous session threads
│   └── ingest.ts               # internal action: ingest the PDF
├── lib/
│   ├── ai.ts                   # Gateway client + model IDs
│   └── arabic.ts               # Arabic normalization helpers
├── scripts/
│   └── ingest-pdf.ts           # one-shot ingest
├── public/
│   └── uae-code.pdf
├── next.config.ts
├── tailwind.config.ts
├── vercel.ts                   # typed Vercel config
├── package.json
└── .env.local
```

## 5. Convex schema

```ts
// convex/schema.ts
export default defineSchema({
  threads: defineTable({
    sessionId: v.string(),       // anonymous cookie-based id
    title: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),

  messages: defineTable({
    threadId: v.id("threads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    citations: v.optional(v.array(v.object({
      page: v.number(),
      snippet: v.string(),
      score: v.number(),
    }))),
    createdAt: v.number(),
  }).index("by_thread", ["threadId"]),
});
```

RAG tables (documents, chunks, embeddings) are managed by the `@convex-dev/rag` component.

## 6. RAG configuration

```ts
// convex/rag.ts
const rag = new RAG(components.rag, {
  textEmbeddingModel: gateway.textEmbeddingModel("cohere/embed-multilingual-v3.0"),
  embeddingDimension: 1024,
  filterNames: ["page", "section"],
});
```

**Chunking strategy:**
- Extract per-page text with `pdf-parse` → preserves page numbers
- Normalize Arabic for embedding only (strip tatweel `ـ`, unify alef forms); keep originals for display
- Split on Arabic sentence punctuation (`.`, `؟`, `!`, `،` + newline runs)
- **~800 chars / chunk, 120 char overlap** (Arabic is denser per char)
- Filter metadata per chunk: `{ page, sectionTitle }`

## 7. Ingestion

One-shot script:
```bash
pnpm tsx scripts/ingest-pdf.ts
```
- Reads `public/uae-code.pdf`
- Emits page-aware, Arabic-aware chunks
- Calls `rag.add({ namespace: "uae-code", chunks, metadata })`
- Idempotent via content hash — re-runs don't duplicate

## 8. Chat flow

1. User submits Arabic query → POST `/api/chat` with `threadId` + message
2. Route handler calls Convex action `threads.ask`
3. `rag.search({ query, limit: 6, filter: { namespace: "uae-code" } })`
4. System prompt (Arabic):
   > أجب دائماً بالعربية الفصحى، استناداً فقط إلى المقتطفات التالية من وثيقة "كود الإمارات للخدمات الحكومية وتصفير البيروقراطية". إذا لم تجد الإجابة في المقتطفات، قل ذلك بوضوح. اذكر رقم الصفحة لكل معلومة.
5. Stream `anthropic/claude-sonnet-4-6` via Gateway with `streamText`
6. Persist final assistant message + citations to Convex

## 9. UI structure (single page, RTL)

```
┌─────────────────────────────────────────────┐
│  [UAE emblem]   كود الإمارات                │ ← UAE DS header (title)
│                 للخدمات الحكومية            │ ← subtitle line 1
│                 وتصفير البيروقراطية         │ ← subtitle line 2
├─────────────────────────────────────────────┤
│                                             │
│     أهلاً بك. اسألني عن كود الإمارات.       │ ← empty-state card
│     [اقتراح 1]  [اقتراح 2]  [اقتراح 3]      │ ← suggested questions
│                                             │
│  ─────────────────────────────────────────  │
│                              ◆ رسالة المستخدم│ ← user bubble (RTL: right)
│  رد المساعد ◆                               │
│  📄 صفحة 12   📄 صفحة 34                    │ ← citation chips
│  ─────────────────────────────────────────  │
│                                             │
├─────────────────────────────────────────────┤
│  [ اكتب سؤالك هنا...              ] [ إرسال ] │ ← composer
└─────────────────────────────────────────────┘
```

- `<html lang="ar" dir="rtl">` at the root
- Fonts (per UAE DS RTL spec, loaded via `next/font/google`):
  - Headings → **Alexandria** (weights 200, 600, 700, 800)
  - Body → **Noto Kufi Arabic** (weights 300, 400, 500, 600, 700, 900)
  - Wire into UAE DS via CSS vars: `--font-heading: var(--font-alexandria); --font-body: var(--font-notokufi);`
- Color tokens + components from `@aegov/design-system`
- Source drawer slides in from the **left** (RTL-aware) when a citation chip is clicked

## 10. Rate limiting & safety

- `@convex-dev/rate-limiter`: **30 msg / IP / hour**, **200 / IP / day**
- Reject queries > 1000 chars
- Prompt-injection hardening in system prompt
- No PII stored — sessionId is a random UUID in an httpOnly cookie

## 11. Environment variables

```
# .env.local
AI_GATEWAY_API_KEY=...        # Vercel dashboard → AI Gateway
NEXT_PUBLIC_CONVEX_URL=...    # from `npx convex dev`
CONVEX_DEPLOY_KEY=...         # Vercel env only (prod deploys)
```

All managed via `vercel env pull` / `vercel.ts`.

---

## 12. Progress tracker

### Phase 1 — Scaffold
- [ ] `pnpm create next-app@latest` (TS, App Router, Tailwind)
- [ ] Install `@aegov/design-system-react` + configure Tailwind plugin
- [ ] Set `<html lang="ar" dir="rtl">` + load Alexandria & Noto Kufi Arabic via `next/font/google` and bind to UAE DS `--font-heading` / `--font-body`
- [ ] `npx convex dev` — initialize Convex project
- [ ] `vercel link` — link to Vercel project
- [ ] Enable Vercel AI Gateway, pull `AI_GATEWAY_API_KEY` via `vercel env pull`
- [ ] Create `vercel.ts` config
- [ ] Verify hello-world page renders RTL in browser

### Phase 2 — Backend
- [ ] `convex/schema.ts` — threads + messages tables
- [ ] Install `@convex-dev/rag` and `@convex-dev/rate-limiter`
- [ ] Register both in `convex/convex.config.ts`
- [ ] `lib/ai.ts` — Gateway client, model IDs as constants
- [ ] `convex/rag.ts` — instantiate `RAG` with Cohere multilingual
- [ ] `convex/threads.ts` — `getOrCreateThread`, `listMessages`, `ask` action
- [ ] Rate limiter rules: 30/hr, 200/day per IP

### Phase 3 — Ingestion
- [ ] Copy PDF → `public/uae-code.pdf`
- [ ] `lib/arabic.ts` — normalization + Arabic-aware splitter
- [ ] `scripts/ingest-pdf.ts` — parse PDF per-page, chunk, add to RAG
- [ ] Run ingest, verify chunk count + sample embeddings
- [ ] Idempotency: content-hash check before re-adding

### Phase 4 — Chat UI
- [ ] `app/layout.tsx` — RTL root, font, header, footer
- [ ] `components/layout/app-header.tsx` — UAE DS header w/ emblem
- [ ] `components/chat/composer.tsx` — textarea + send, Cmd/Ctrl+Enter
- [ ] `components/chat/message-bubble.tsx` — user/assistant RTL styling
- [ ] `components/chat/chat-panel.tsx` — wires `useChat` + Convex messages
- [ ] `app/api/chat/route.ts` — streams from Convex `ask` action
- [ ] Empty state w/ 3 suggested Arabic questions

### Phase 5 — Citations
- [ ] `components/chat/citation-chip.tsx` — "صفحة N" chip
- [ ] `components/chat/source-drawer.tsx` — left-sliding panel, shows chunks
- [ ] Persist citations with each assistant message
- [ ] Hover/click chip → highlight in drawer

### Phase 6 — Polish
- [ ] Loading skeletons (UAE DS)
- [ ] Error states — all messages in Arabic
- [ ] Mobile RTL layout + keyboard behavior
- [ ] a11y pass: focus order in RTL, ARIA labels in Arabic, WCAG 2.2 AA

### Phase 7 — Deploy
- [ ] `vercel deploy` preview, smoke-test end-to-end
- [ ] Set Convex prod deployment + push schema
- [ ] Run ingestion against prod Convex
- [ ] Promote to production
- [ ] Verify AI Gateway quotas + rate limiter in prod

---

## 13. Open questions

_All resolved — ready for Phase 1._
