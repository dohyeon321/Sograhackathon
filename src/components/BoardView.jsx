import PostCard from './PostCard'

function BoardView({ selectedCategory }) {
  const posts = [
    {
      id: 1,
      category: '맛집',
      author: '대전토박이',
      isLocal: true,
      timeAgo: '2시간 전',
      title: '은행동 숨은 맛집 발견!',
      excerpt: '30년 전통의 작은 분식집인데 진짜 맛있어요. 떡볶이 맛이 예술이고 튀김도 바삭바삭합니다...',
      location: '대전 중구 은행동',
      likes: 42,
      comments: 18,
      views: 234,
      emoji: '🍜'
    },
    {
      id: 2,
      category: '꿀팁',
      author: '유성구민',
      isLocal: true,
      timeAgo: '5시간 전',
      title: '대전 버스 환승 꿀팁',
      excerpt: '10년 넘게 대전 살면서 알게 된 버스 꿀팁! 환승 루트 잘 짜면 시간도 돈도 절약 가능합니다...',
      location: '대전 유성구',
      likes: 67,
      comments: 31,
      views: 512,
      emoji: '💡'
    },
    {
      id: 3,
      category: '핫플',
      author: '서구댁',
      isLocal: true,
      timeAgo: '1일 전',
      title: '대전역 근처 핫플 총정리',
      excerpt: '대전역 앞이 요즘 완전 핫해졌어요! 새로 생긴 감성 카페들과 맛집들 직접 다녀온 후기입니다...',
      location: '대전 동구 대전역',
      likes: 89,
      comments: 45,
      views: 892,
      emoji: '🎉'
    },
    {
      id: 4,
      category: '맛집',
      author: '중구토박이',
      isLocal: true,
      timeAgo: '1일 전',
      title: '중앙시장 진짜 맛집만 모음',
      excerpt: '중앙시장 30년 단골인 우리 부모님께 물어본 찐 맛집들! 관광객들은 모르는 현지인만 아는 곳...',
      location: '대전 동구 중앙시장',
      likes: 123,
      comments: 67,
      views: 1200,
      emoji: '🍽️'
    },
    {
      id: 5,
      category: '관광',
      author: '대전여행러버',
      isLocal: true,
      timeAgo: '2일 전',
      title: '엑스포 과학공원 완전 정복',
      excerpt: '엑스포 과학공원 제대로 즐기는 법! 볼거리가 정말 많아요. 가족 나들이 코스로 최고...',
      location: '대전 유성구 엑스포',
      likes: 92,
      comments: 34,
      views: 678,
      emoji: '🏛️'
    },
    {
      id: 6,
      category: '관광',
      author: '자연이조아',
      isLocal: true,
      timeAgo: '3일 전',
      title: '대청호 오백리길 산책 코스',
      excerpt: '주말에 대청호 다녀왔는데 경치가 정말 끝내줍니다! 산책하기 딱 좋은 코스 소개해드려요...',
      location: '대전 동구 대청호',
      likes: 65,
      comments: 19,
      views: 523,
      emoji: '🌳'
    },
    {
      id: 7,
      category: '핫플',
      author: '유성온천동',
      isLocal: true,
      timeAgo: '3일 전',
      title: '유성 감성카페 추천',
      excerpt: '유성온천 근처 숨겨진 감성 카페! 인테리어도 이쁘고 커피 맛도 좋아요. 데이트 코스로 강추...',
      location: '대전 유성구 온천동',
      likes: 78,
      comments: 23,
      views: 456,
      emoji: '☕'
    },
    {
      id: 8,
      category: '교통',
      author: '둔산동거주자',
      isLocal: true,
      timeAgo: '4일 전',
      title: '대전 주차하기 좋은 곳',
      excerpt: '대전 10년 살면서 찾은 무료/저렴 주차장 리스트! 주말에 놀러갈 때 주차 고민 끝...',
      location: '대전 서구 둔산동',
      likes: 156,
      comments: 89,
      views: 2100,
      emoji: '🚗'
    },
    {
      id: 9,
      category: '맛집',
      author: '먹방크리에이터',
      isLocal: true,
      timeAgo: '5일 전',
      title: '대전 칼국수 맛집 베스트3',
      excerpt: '대전에서 칼국수 맛집을 찾으신다면 여기! 손칼국수 맛이 일품인 집들만 모았어요...',
      location: '대전 중구',
      likes: 134,
      comments: 56,
      views: 1500,
      emoji: '🍜'
    }
  ]

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

export default BoardView

