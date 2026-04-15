export type BlogPostSummary = {
  id?: string | number
  slug: string
  title: string
  excerpt?: string
  meta_description?: string
  featured_image_url?: string
  author_name?: string
  published_at?: string
  canonical_url?: string
}

export type BlogPostDetail = BlogPostSummary & {
  content_html?: string
  content?: string
}

type FetchResult<T> = {
  data: T
  sourceUrl: string
}

const BLOG_API_BASE = (import.meta.env.VITE_BLOG_API_BASE || 'https://aisaasmarketer.machomelab.com').replace(/\/$/, '')
const PRODUCT_ID = import.meta.env.VITE_BLOG_PRODUCT_ID || 'aicollegematcher'

function normalizeArrayPayload(payload: unknown): BlogPostSummary[] {
  if (Array.isArray(payload)) return payload as BlogPostSummary[]
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    for (const key of ['posts', 'items', 'results', 'data']) {
      if (Array.isArray(obj[key])) return obj[key] as BlogPostSummary[]
    }
  }
  return []
}

function normalizeDetailPayload(payload: unknown): BlogPostDetail | null {
  if (!payload || typeof payload !== 'object') return null
  const obj = payload as Record<string, unknown>
  if (typeof obj.slug === 'string' || typeof obj.title === 'string') return obj as BlogPostDetail
  for (const key of ['post', 'item', 'data']) {
    const nested = obj[key]
    if (nested && typeof nested === 'object') {
      const nestedObj = nested as Record<string, unknown>
      if (typeof nestedObj.slug === 'string' || typeof nestedObj.title === 'string') return nestedObj as BlogPostDetail
    }
  }
  return null
}

async function fetchJson<T>(path: string): Promise<FetchResult<T>> {
  const url = `${BLOG_API_BASE}${path}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Blog API request failed: ${response.status} ${response.statusText}`)
  }
  return { data: await response.json() as T, sourceUrl: url }
}

export async function fetchBlogPosts(): Promise<FetchResult<BlogPostSummary[]>> {
  const primary = `/api/content/blog/${PRODUCT_ID}/posts`
  try {
    const result = await fetchJson<unknown>(primary)
    return { ...result, data: normalizeArrayPayload(result.data) }
  } catch {
    const fallback = `/api/content/blog/${PRODUCT_ID}/posts?status=published`
    const result = await fetchJson<unknown>(fallback)
    return { ...result, data: normalizeArrayPayload(result.data) }
  }
}

export async function fetchBlogPost(slug: string): Promise<FetchResult<BlogPostDetail>> {
  const result = await fetchJson<unknown>(`/api/content/blog/${PRODUCT_ID}/posts/${encodeURIComponent(slug)}`)
  const post = normalizeDetailPayload(result.data)
  if (!post) throw new Error('Blog post response was not in the expected format')
  return { ...result, data: post }
}

export function getBlogCanonicalUrl(slug?: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aicollegematcher.com'
  return slug ? `${origin}/blog/${slug}` : `${origin}/blog`
}

export function formatBlogDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
