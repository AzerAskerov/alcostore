import { BottleArt } from './BottleArt'

export function ProductImage({
  url,
  category,
  name,
  className = '',
  fit = 'cover',
}: {
  url: string | null | undefined
  category: string
  name: string
  className?: string
  fit?: 'cover' | 'contain'
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} loading="lazy" className={`h-full w-full ${fit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`} />
  }
  return <BottleArt category={category} label={name} className={`h-full w-full ${className}`} />
}
