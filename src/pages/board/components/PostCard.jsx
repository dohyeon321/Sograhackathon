function PostCard({ post, onClick }) {
  const formatViews = (views) => {
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

  return (
    <div
      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-6xl overflow-hidden">
        {post.images && post.images.length > 0 ? (
          <img
            src={post.images[0]}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{post.emoji}</span>
        )}
        <div className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded text-xs font-semibold text-gray-700">
          {post.category}
        </div>
      </div>




      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
          <span>{post.author}</span>
          {post.authorIsLocal && (
            <span className="bg-yellow-400 text-white px-2 py-0.5 rounded text-xs font-semibold">
              로컬
            </span>
          )}
          <span>•</span>
          <span>{post.timeAgo}</span>
        </div>
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="text-sm text-blue-500 mb-3">
          📍 {post.locationAlias || post.location}
        </div>
        <div className="flex gap-4 pt-3 border-t border-gray-100 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            ❤️ {post.likes}
          </span>
          <span className="flex items-center gap-1">
            💬 {post.comments}
          </span>
          <span className="flex items-center gap-1">
            👁️ {formatViews(post.views)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PostCard

