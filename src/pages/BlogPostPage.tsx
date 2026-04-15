import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchBlogPost, formatBlogDate, getBlogCanonicalUrl, type BlogPostDetail } from '../services/blog'

function toHtml(post: BlogPostDetail) {
  if (post.content_html) return post.content_html
  if (post.content) return post.content
  return '<p>Article content is unavailable right now.</p>'
}

export default function BlogPostPage() {
  const { slug = '' } = useParams()
  const [post, setPost] = useState<BlogPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchBlogPost(slug)
      .then(({ data }) => {
        if (!cancelled) setPost(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Unable to load this article.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const canonical = useMemo(() => getBlogCanonicalUrl(slug), [slug])
  const title = post?.title ? `${post.title} | AI College Matcher Blog` : 'AI College Matcher Blog'
  const description = post?.meta_description || post?.excerpt || 'College planning insights from AI College Matcher.'

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        {post?.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
        <link rel="canonical" href={canonical} />
      </Helmet>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="mb-8">
          <Link to="/blog" className="text-sm font-semibold text-gold no-underline hover:text-gold-dark transition-colors">← Back to blog</Link>
        </div>

        {loading && <p className="text-text-light">Loading article...</p>}
        {error && !loading && <p className="text-red-600">{error}</p>}

        {post && !loading && !error && (
          <article>
            <header className="mb-10">
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-light mb-4">
                {formatBlogDate(post.published_at) && <span>{formatBlogDate(post.published_at)}</span>}
                {post.author_name && <span>By {post.author_name}</span>}
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-navy leading-tight mb-4">{post.title}</h1>
              {description && <p className="text-lg text-text-light leading-8">{description}</p>}
            </header>

            {post.featured_image_url && (
              <img src={post.featured_image_url} alt={post.title} className="w-full max-h-[420px] object-cover rounded-3xl mb-10" />
            )}

            <div
              className="blog-content prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-navy prose-p:text-text prose-a:text-gold prose-img:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: toHtml(post) }}
            />
          </article>
        )}
      </main>
      <Footer />
    </div>
  )
}
