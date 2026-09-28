export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl py-12">
      <h1 className="font-serif text-5xl">{title}</h1>
      <p className="mt-2 font-mono text-xs text-faint">Son yenilənmə: {updated}</p>
      <div className="prose-legal mt-8 space-y-5 leading-relaxed text-text3 [&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-text [&_li]:ml-5 [&_li]:list-disc [&_a]:text-gold">
        {children}
      </div>
    </article>
  )
}
