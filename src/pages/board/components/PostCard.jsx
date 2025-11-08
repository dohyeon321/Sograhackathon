function PostCard({ post, onClick }) {
  const formatViews = (views) => {
    if (!views) return '0'
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`
    }
    return views.toString()
  }

  const handleClick = () => {
    if (onClick) {
      onClick(post.id)
    }
  }

  const likes = typeof post.likes === 'number' ? post.likes : 0
  const comments = typeof post.comments === 'number' ? post.comments : 0
  const locationLabel = post.locationAlias || post.location || '대전 · 충청'

  return (
    <article
      onClick={handleClick}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_28px_60px_-45px_rgba(15,23,42,0.45)] transition hover:-translate-y-1 hover:shadow-[0_38px_75px_-45px_rgba(37,99,235,0.5)] backdrop-blur"
    >
      <div className="relative h-48 overflow-hidden">
        {post.images && post.images.length > 0 ? (
          <img
            src={post.images[0]}
            alt={post.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100 text-6xl">
            {post.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
          <span className="text-base">{post.emoji}</span>
          <span>{post.category || '로컬 스토리'}</span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-white drop-shadow">
            {post.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/90 to-blue-600/90 text-sm font-semibold text-white shadow">
              {post.author?.[0] || '로'}
            </div>
            <div>
              <p className="font-semibold text-slate-700">{post.author || '로컬'}</p>
              <p className="text-xs text-slate-400">{post.timeAgo}</p>
            </div>
          </div>
          {post.isLocal && (
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              LOCAL
            </span>
          )}
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
          {post.excerpt || '로컬이 전하는 살아있는 정보를 확인해보세요.'}
        </p>

        <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
          <span className="text-base">📍</span>
          <span>{locationLabel}</span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            ❤️ {likes}
          </span>
          <span className="flex items-center gap-1">
            💬 {comments}
          </span>
          <span className="flex items-center gap-1">
            👁️ {formatViews(post.views)}
          </span>
          <span className="flex items-center gap-1 text-blue-500">
            자세히 보기 →
          </span>
        </div>
      </div>
    </article>
  )
}

export default PostCard

