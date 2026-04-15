import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchBlogPosts, formatBlogDate, getBlogCanonicalUrl, type BlogPostSummary } from '../services/blog'

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchBlogPosts()
      .then(({ data }) => {
        if (!cancelled) setPosts(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Unable to load blog posts.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>AI College Matcher Blog</title>
        <meta name="description" content="Guides, advice, and AI-powered college planning insights from AI College Matcher." />
        <meta property="og:title" content="AI College Matcher Blog" />
        <meta property="og:description" content="Guides, advice, and AI-powered college planning insights from AI College Matcher." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={getBlogCanonicalUrl()} />
      </Helmet>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="max-w-3xl mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold mb-3">Blog</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-navy mb-4">College planning insights that actually help</h1>
          <p className="text-lg text-text-light">Fresh articles from the AI College Matcher content hub, published directly from AISaaS Marketer.</p>
        </div>

        {loading && <p className="text-text-light">Loading blog posts...</p>}
        {error && !loading && <p className="text-red-600">{error}</p>}
        {!loading && !error && posts.length === 0 && <p className="text-text-light">No published blog posts found yet.</p>}

        <div className="grid gap-6">
          {posts.map((post) => (
            <article key={post.slug} className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {post.featured_image_url && (
                <img src={post.featured_image_url} alt={post.title} className="w-full h-64 object-cover" />
              )}
              <div className="p-8">
                <div className="flex flex-wrap items-center gap-3 text-sm text-text-light mb-3">
                  {formatBlogDate(post.published_at) && <span>{formatBlogDate(post.published_at)}</span>}
                  {post.author_name && <span>By {post.author_name}</span>}
                </div>
                <h2 className="font-serif text-2xl font-bold text-navy mb-3">
                  <Link to={`/blog/${post.slug}`} className="no-underline text-inherit hover:text-gold transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-text-light leading-7 mb-5">{post.excerpt || post.meta_description || 'Read the full article.'}</p>
                <Link to={`/blog/${post.slug}`} className="inline-flex items-center text-navy font-semibold no-underline hover:text-gold transition-colors">
                  Read article
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
