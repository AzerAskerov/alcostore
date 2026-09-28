import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <div className="kicker text-red">404</div>
      <h1 className="mt-3 font-serif text-5xl">Səhifə tapılmadı</h1>
      <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-[14px] bg-red px-6 font-semibold text-on-red">
        Ana səhifə
      </Link>
    </div>
  )
}
