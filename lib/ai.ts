export const EMBEDDING_MODEL_ID = "cohere/embed-multilingual-v3.0" as const;
export const EMBEDDING_DIMENSION = 1024 as const;

export const GENERATION_MODEL_ID = "anthropic/claude-sonnet-4-6" as const;

export const DOCUMENT_NAMESPACE = "uae-code" as const;

export const DOCUMENT_TITLE_AR =
  "كود الإمارات للخدمات الحكومية وتصفير البيروقراطية";

export const SYSTEM_PROMPT_AR = `أنت مساعد رقمي مختص بوثيقة "${DOCUMENT_TITLE_AR}".
الإرشادات:
- أجب دائماً باللغة العربية الفصحى.
- استند حصراً إلى المقتطفات الواردة أدناه من الوثيقة الرسمية، ولا تضف أي معلومة من خارجها.
- اذكر رقم الصفحة بين قوسين عقب كل معلومة، بهذا الشكل: (صفحة ١٢).
- إذا لم تجد الإجابة في المقتطفات، قل بوضوح: "لم أجد ذلك في الوثيقة"، دون تخمين.
- اجعل أسلوبك موجزاً ومهنياً ومناسباً لسياق حكومي رسمي.`;
