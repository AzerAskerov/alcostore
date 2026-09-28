/** API ilə klientlər (mobil, veb, admin) arasında ortaq tiplər. */

export interface Category {
  id: number
  slug: string
  name_az: string
  name_ru: string | null
  sort: number
  is_active: boolean
  product_count?: number
}

export interface ProductVariant {
  id: number
  product_id: number
  /** Həcm millilitrlə: 700 → "0.7 L" */
  volume_ml: number
  /** Paketdəki ədəd (məs. pivə ×6). 1 = tək şüşə */
  pack_size: number
  price: number
  old_price: number | null
  stock: number
  sku: string | null
  is_active: boolean
}

export interface ProductImage {
  id: number
  product_id: number
  url: string
  sort: number
}

export interface Product {
  id: number
  slug: string
  category_id: number
  category_slug: string
  category_name: string
  brand: string | null
  name: string
  description_az: string | null
  description_ru: string | null
  country: string | null
  /** Spirt faizi, məs. 40 */
  abv: number | null
  has_gift_box: boolean
  is_featured: boolean
  is_active: boolean
  sort: number
  variants: ProductVariant[]
  images: ProductImage[]
  created_at: string
  updated_at: string
}

/** Siyahılar üçün yüngül forma — göstərilən (ən ucuz stokda olan) variantla. */
export interface ProductSummary {
  id: number
  slug: string
  name: string
  brand: string | null
  country: string | null
  category_slug: string
  category_name: string
  image_url: string | null
  variant: ProductVariant | null
  variant_count: number
  is_featured: boolean
}

export interface Banner {
  id: number
  kicker: string | null
  title: string
  subtitle: string | null
  image_url: string | null
  /** Daxili link: "/kateqoriya/viski", "/mehsul/chivas-regal-12" */
  link: string | null
  sort: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
}

export interface StoreSettings {
  store_name: string
  tagline: string
  whatsapp_number: string
  phone: string
  /** "10:00" */
  open_from: string
  /** "23:00" */
  open_to: string
  delivery_area: string
  delivery_text: string
  /** Bu məbləğdən yuxarı çatdırılma pulsuzdur (0 = həmişə pulsuz) */
  free_delivery_min: number
  delivery_fee: number
  min_order: number
  support_email: string
  address: string
  instagram: string
}

export interface CartLine {
  product_id: number
  variant_id: number
  slug: string
  name: string
  volume_ml: number
  pack_size: number
  unit_price: number
  qty: number
  image_url: string | null
  category_slug: string
}

export type OrderSource = 'ios' | 'android' | 'web'
export type OrderStatus = 'new' | 'confirmed' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: number
  order_id: number
  product_id: number | null
  variant_id: number | null
  name: string
  volume_ml: number
  pack_size: number
  unit_price: number
  qty: number
  line_total: number
}

export interface Order {
  id: number
  code: string
  device_id: string | null
  source: OrderSource
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  total: number
  note: string | null
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface CreateOrderInput {
  device_id?: string
  source: OrderSource
  note?: string
  items: { variant_id: number; qty: number }[]
}

export interface CreateOrderResult {
  order: Order
  whatsapp_url: string
  message: string
}

export interface HomePayload {
  settings: StoreSettings
  categories: Category[]
  banners: Banner[]
  popular: ProductSummary[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export type ProductSort = 'popular' | 'price_asc' | 'price_desc' | 'name' | 'new'

export interface ProductQuery {
  category?: string
  q?: string
  country?: string
  volume_ml?: number
  sort?: ProductSort
  page?: number
  page_size?: number
  featured?: boolean
}

export interface ProductFacets {
  countries: string[]
  volumes: number[]
}

export interface NotificationLog {
  id: number
  title: string
  body: string
  link: string | null
  target: string
  sent_count: number
  failed_count: number
  created_by: string | null
  created_at: string
}

export interface AdminStats {
  products: number
  active_products: number
  orders_today: number
  orders_total: number
  devices: number
  push_devices: number
}
