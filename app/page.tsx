export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        مشروع قيد الإنشاء
      </p>
      <h1
        className="mt-2 text-4xl font-extrabold leading-tight md:text-5xl"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        كود الإمارات
      </h1>
      <p className="mt-3 text-lg text-zinc-600 md:text-xl">
        للخدمات الحكومية وتصفير البيروقراطية
      </p>
      <p className="mt-10 max-w-prose leading-8 text-zinc-800">
        مرحباً بك. هذه واجهة مؤقتة للتحقق من عرض اللغة العربية من اليمين إلى اليسار
        وتفعيل خطوط نظام التصميم الحكومي. ستُبنى تجربة المحادثة الكاملة في المراحل
        التالية.
      </p>

      <section className="mt-10 rounded-lg border border-zinc-200 bg-zinc-50 p-6">
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          فحوصات سريعة
        </h2>
        <ul className="mt-3 list-disc space-y-1 pe-6 text-zinc-700">
          <li>اتجاه الصفحة: يمين إلى يسار (RTL)</li>
          <li>
            خط العناوين: <span className="font-bold">Alexandria</span>
          </li>
          <li>
            خط النص: <span className="font-bold">Noto Kufi Arabic</span>
          </li>
        </ul>
      </section>
    </main>
  );
}
