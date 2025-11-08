import { useState, useEffect } from 'react'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

// 대전 유명 명소 데이터
const DAEJEON_ATTRACTIONS = [
  { id: 1, name: '대전 엑스포과학공원', description: '과학과 기술을 체험할 수 있는 공원', emoji: '🔬', location: '대전 유성구', color: 'from-blue-400 to-cyan-400', info: '대전 엑스포과학공원은 1993년 대전세계박람회 개최지로 조성된 과학 테마파크입니다. 다양한 과학 전시관과 체험 시설이 있어 가족 단위 방문객들에게 인기가 높습니다. 특히 우주관, 자연사관, 과학관 등이 있어 아이들의 과학적 호기심을 자극합니다.' },
  { id: 2, name: '한밭수목원', description: '도심 속 휴식 공간', emoji: '🌳', location: '대전 서구', color: 'from-green-400 to-emerald-400', info: '한밭수목원은 대전 도심 한가운데 위치한 넓은 수목원으로, 다양한 식물과 아름다운 정원을 감상할 수 있습니다. 산책로와 호수가 있어 도심 속에서 자연을 즐기고 싶은 분들에게 추천합니다. 봄에는 벚꽃이 아름답게 피어나 많은 사람들이 찾는 명소입니다.' },
  { id: 3, name: '대전 오월드', description: '테마파크와 동물원', emoji: '🎢', location: '대전 중구', color: 'from-purple-400 to-pink-400', info: '대전 오월드는 테마파크와 동물원이 함께 있는 복합 테마파크입니다. 다양한 놀이기구와 동물들을 볼 수 있어 가족 나들이 장소로 인기가 높습니다. 특히 동물원에서는 다양한 동물들을 가까이에서 관찰할 수 있어 아이들에게 인기가 많습니다.' },
  { id: 4, name: '계룡산국립공원', description: '자연과 역사가 공존하는 산', emoji: '⛰️', location: '대전 동구', color: 'from-gray-400 to-slate-400', info: '계룡산국립공원은 대전과 공주, 논산에 걸쳐 있는 국립공원으로, 아름다운 자연 경관과 역사적 유적이 공존하는 곳입니다. 등산로가 잘 정비되어 있어 등산을 즐기기에 좋으며, 특히 가을 단풍이 유명합니다. 동학사, 갑사 등 유명한 사찰도 있어 문화 탐방도 가능합니다.' },
  { id: 5, name: '대전시립미술관', description: '현대 미술 작품 감상', emoji: '🎨', location: '대전 유성구', color: 'from-indigo-400 to-purple-400', info: '대전시립미술관은 현대 미술 작품을 전시하는 미술관으로, 다양한 기획 전시와 상설 전시를 통해 현대 미술의 흐름을 감상할 수 있습니다. 건축물 자체도 현대적이고 아름다워 많은 사람들이 찾는 명소입니다. 주변에 한밭수목원이 있어 함께 방문하기 좋습니다.' }
]

// 충청북도 유명 명소 데이터
const CHUNGBUK_ATTRACTIONS = [
  { id: 1, name: '청주 상당산성', description: '역사적인 산성 유적', emoji: '🏰', location: '충북 청주시', color: 'from-amber-400 to-orange-400', info: '청주 상당산성은 삼국시대에 축조된 산성으로, 청주 시내를 한눈에 내려다볼 수 있는 전망대가 있습니다. 산성 내부에는 다양한 역사적 유적이 남아있어 역사 탐방을 즐길 수 있습니다. 특히 봄 벚꽃과 가을 단풍이 아름다워 사진 촬영 명소로도 유명합니다.' },
  { id: 2, name: '충주 탄금대', description: '임진왜란의 역사적 장소', emoji: '⚔️', location: '충북 충주시', color: 'from-red-400 to-rose-400', info: '충주 탄금대는 임진왜란 당시 충주 탄금대 전투가 벌어진 역사적 장소입니다. 남한강을 내려다보는 절경이 있어 많은 관광객들이 찾는 곳입니다. 주변에 충주호가 있어 낚시와 수상 레저를 즐길 수 있으며, 역사적 의미를 되새기며 방문하기 좋은 곳입니다.' },
  { id: 3, name: '제천 의림지', description: '고려시대 저수지', emoji: '💧', location: '충북 제천시', color: 'from-blue-400 to-cyan-400', info: '제천 의림지는 고려시대에 축조된 저수지로, 천년의 역사를 간직한 인공 호수입니다. 주변에 아름다운 산책로가 있어 산책을 즐기기에 좋으며, 특히 가을 단풍이 아름답습니다. 호수 주변에는 다양한 식물과 새들이 서식하여 자연 관찰에도 좋은 곳입니다.' },
  { id: 4, name: '보은 법주사', description: '천년 고찰', emoji: '🛕', location: '충북 보은군', color: 'from-yellow-400 to-amber-400', info: '보은 법주사는 신라시대에 창건된 천년 고찰로, 특히 팔상전이라는 국보급 건축물이 유명합니다. 사찰 주변의 자연 경관이 아름답고, 특히 가을 단풍이 장관을 이룹니다. 사찰 내부에는 다양한 문화재가 보관되어 있어 문화 탐방을 즐길 수 있습니다.' },
  { id: 5, name: '단양 고수동굴', description: '대한민국 최대 석회동굴', emoji: '🕳️', location: '충북 단양군', color: 'from-gray-500 to-slate-500', info: '단양 고수동굴은 대한민국에서 가장 큰 석회동굴로, 아름다운 종유석과 석순이 형성되어 있습니다. 동굴 내부는 일년 내내 일정한 온도를 유지하여 여름에는 시원하고 겨울에는 따뜻합니다. 동굴 탐험을 통해 자연의 신비를 느낄 수 있는 곳입니다.' }
]

// 충청남도 유명 명소 데이터
const CHUNGNAM_ATTRACTIONS = [
  { id: 1, name: '공주 공산성', description: '백제의 역사가 살아있는 성', emoji: '🏛️', location: '충남 공주시', color: 'from-amber-500 to-yellow-500', info: '공주 공산성은 백제시대에 축조된 산성으로, 백제의 역사와 문화를 느낄 수 있는 곳입니다. 성벽을 따라 산책로가 조성되어 있어 산책을 즐기며 역사를 되새길 수 있습니다. 특히 봄 벚꽃과 가을 단풍이 아름답고, 성에서 내려다보는 공주 시내 전경이 장관입니다.' },
  { id: 2, name: '부여 정림사지', description: '백제 불교문화의 정수', emoji: '🛕', location: '충남 부여군', color: 'from-yellow-400 to-amber-400', info: '부여 정림사지는 백제시대에 건립된 사찰 터로, 특히 정림사지 오층석탑이 국보로 지정되어 있습니다. 백제 불교문화의 정수를 보여주는 유적지로, 주변에 부여 왕릉원과 함께 백제 문화를 체험할 수 있는 곳입니다. 역사와 문화에 관심이 있는 분들에게 추천합니다.' },
  { id: 3, name: '천안 독립기념관', description: '독립운동의 역사', emoji: '🇰🇷', location: '충남 천안시', color: 'from-red-400 to-rose-400', info: '천안 독립기념관은 우리나라 독립운동의 역사를 한눈에 볼 수 있는 국립 기념관입니다. 다양한 전시관과 체험 시설이 있어 독립운동의 역사를 생생하게 배울 수 있습니다. 특히 어린이와 청소년들의 역사 교육 장소로 많이 활용되며, 넓은 야외 공원도 있어 가족 나들이 장소로도 좋습니다.' },
  { id: 4, name: '태안 안면도', description: '아름다운 해안과 해수욕장', emoji: '🏖️', location: '충남 태안군', color: 'from-blue-400 to-cyan-400', info: '태안 안면도는 아름다운 해안과 해수욕장이 있는 섬으로, 여름 휴가철에 많은 관광객들이 찾는 곳입니다. 특히 안면도 해수욕장은 모래사장이 넓고 수심이 얕아 가족 단위 방문객들에게 인기가 높습니다. 주변에 다양한 해산물 식당이 있어 신선한 해산물을 맛볼 수 있습니다.' },
  { id: 5, name: '서산 해미읍성', description: '조선시대 읍성 유적', emoji: '🏯', location: '충남 서산시', color: 'from-orange-400 to-amber-400', info: '서산 해미읍성은 조선시대에 축조된 읍성으로, 당시의 성곽 구조를 잘 보존하고 있습니다. 성벽을 따라 산책로가 조성되어 있어 역사 탐방을 즐길 수 있으며, 특히 봄과 가을에 방문하면 아름다운 자연 경관을 함께 감상할 수 있습니다. 주변에 다양한 문화재와 유적이 있어 역사에 관심이 있는 분들에게 추천합니다.' }
]

// 명소 데이터를 export하여 상세 페이지에서 사용
export const getAttractionData = (region, attractionId) => {
  let attractions = []
  switch (region) {
    case 'daejeon':
      attractions = DAEJEON_ATTRACTIONS
      break
    case 'chungbuk':
      attractions = CHUNGBUK_ATTRACTIONS
      break
    case 'chungnam':
      attractions = CHUNGNAM_ATTRACTIONS
      break
    default:
      attractions = DAEJEON_ATTRACTIONS
  }
  return attractions.find(a => a.id === parseInt(attractionId))
}

export { DAEJEON_ATTRACTIONS, CHUNGBUK_ATTRACTIONS, CHUNGNAM_ATTRACTIONS }

function DaejeonChungcheongPage({ onAttractionClick, refreshTrigger }) {
  const [selectedRegion, setSelectedRegion] = useState('daejeon') // daejeon, chungbuk, chungnam
  const [coverPhotos, setCoverPhotos] = useState({}) // { 'daejeon_1': 'url', ... }
  const [lastUpdateDate, setLastUpdateDate] = useState(null) // 마지막 업데이트 날짜

  const getAttractions = () => {
    switch (selectedRegion) {
      case 'daejeon':
        return DAEJEON_ATTRACTIONS
      case 'chungbuk':
        return CHUNGBUK_ATTRACTIONS
      case 'chungnam':
        return CHUNGNAM_ATTRACTIONS
      default:
        return DAEJEON_ATTRACTIONS
    }
  }

  const getRegionName = () => {
    switch (selectedRegion) {
      case 'daejeon':
        return '대전광역시'
      case 'chungbuk':
        return '충청북도'
      case 'chungnam':
        return '충청남도'
      default:
        return '대전광역시'
    }
  }

  const attractions = getAttractions()

  // 표지 사진 가져오기 (현재 선택된 지역의 명소만, 랜덤 선택)
  const fetchCoverPhotos = async () => {
    if (!db) return

    const photosMap = {}
    
    // 현재 선택된 지역의 명소에 대해서만 표지 사진 가져오기 (서버 부하 감소)
    const currentAttractions = getAttractions()
    
    for (const attraction of currentAttractions) {
      try {
        const photosRef = collection(db, 'attractions', `${selectedRegion}_${attraction.id}`, 'photos')
        // 모든 사진 가져오기 (isCover 필터 제거)
        const querySnapshot = await getDocs(photosRef)
        
        if (!querySnapshot.empty) {
          // 모든 사진 중에서 랜덤하게 하나 선택
          const allPhotos = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          
          if (allPhotos.length > 0) {
            // 랜덤 인덱스 선택
            const randomIndex = Math.floor(Math.random() * allPhotos.length)
            photosMap[`${selectedRegion}_${attraction.id}`] = allPhotos[randomIndex].imageUrl
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`표지 사진 불러오기 실패 (${selectedRegion}_${attraction.id}):`, error)
        }
      }
    }
    
    // 기존 표지 사진과 병합 (다른 지역의 표지 사진은 유지)
    setCoverPhotos(prev => ({ ...prev, ...photosMap }))
  }

  // Top 5 업데이트 확인 및 실행 (매월 1일)
  const checkAndUpdateRankings = async () => {
    if (!db) return

    try {
      const now = new Date()
      const currentMonth = now.getMonth() + 1 // 1-12
      const currentYear = now.getFullYear()
      const today = now.getDate()

      // 매월 1일이 아니면 업데이트하지 않음
      if (today !== 1) {
        // 마지막 업데이트 날짜만 가져오기
        const lastUpdateRef = doc(db, 'attractionRankings', 'lastUpdate')
        const lastUpdateSnap = await getDoc(lastUpdateRef)
        if (lastUpdateSnap.exists()) {
          const lastUpdate = lastUpdateSnap.data().date?.toDate()
          if (lastUpdate) {
            setLastUpdateDate(lastUpdate)
          }
        }
        return
      }

      // 매월 1일이면 순위 업데이트
      const lastUpdateRef = doc(db, 'attractionRankings', 'lastUpdate')
      const lastUpdateSnap = await getDoc(lastUpdateRef)
      
      let shouldUpdate = true
      if (lastUpdateSnap.exists()) {
        const lastUpdate = lastUpdateSnap.data().date?.toDate()
        if (lastUpdate) {
          const lastUpdateMonth = lastUpdate.getMonth() + 1
          const lastUpdateYear = lastUpdate.getFullYear()
          // 이번 달에 이미 업데이트했으면 스킵
          if (lastUpdateMonth === currentMonth && lastUpdateYear === currentYear) {
            shouldUpdate = false
            setLastUpdateDate(lastUpdate)
          }
        }
      }

      if (shouldUpdate) {
        // 각 지역별로 명소 통계 수집 및 순위 계산
        const regions = ['daejeon', 'chungbuk', 'chungnam']
        
        for (const region of regions) {
          const attractions = region === 'daejeon' ? DAEJEON_ATTRACTIONS 
            : region === 'chungbuk' ? CHUNGBUK_ATTRACTIONS 
            : CHUNGNAM_ATTRACTIONS
          
          const rankings = []
          
          for (const attraction of attractions) {
            try {
              // 후기 수 가져오기
              const reviewsRef = collection(db, 'attractions', `${region}_${attraction.id}`, 'reviews')
              const reviewsSnapshot = await getDocs(reviewsRef)
              const reviewCount = reviewsSnapshot.size
              
              // 사진 수 가져오기
              const photosRef = collection(db, 'attractions', `${region}_${attraction.id}`, 'photos')
              const photosSnapshot = await getDocs(photosRef)
              const photoCount = photosSnapshot.size
              
              // 점수 계산: 후기 수 * 3 + 사진 수 * 1 (후기가 더 중요)
              const score = reviewCount * 3 + photoCount * 1
              
              rankings.push({
                attractionId: attraction.id,
                score,
                reviewCount,
                photoCount
              })
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error(`명소 통계 수집 실패 (${region}_${attraction.id}):`, error)
              }
            }
          }
          
          // 점수 순으로 정렬
          rankings.sort((a, b) => b.score - a.score)
          
          // Top 5 저장
          const rankingRef = doc(db, 'attractionRankings', `${region}_${currentYear}_${currentMonth}`)
          await setDoc(rankingRef, {
            region,
            year: currentYear,
            month: currentMonth,
            rankings: rankings.slice(0, 5), // Top 5만 저장
            updatedAt: serverTimestamp()
          })
        }
        
        // 마지막 업데이트 날짜 저장
        await setDoc(lastUpdateRef, {
          date: serverTimestamp(),
          year: currentYear,
          month: currentMonth
        })
        
        setLastUpdateDate(now)
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('순위 업데이트 실패:', error)
      }
    }
  }

  useEffect(() => {
    fetchCoverPhotos()
    checkAndUpdateRankings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, refreshTrigger, selectedRegion]) // refreshTrigger나 지역 변경 시 표지 사진 새로고침

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 지역 선택 탭 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setSelectedRegion('daejeon')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                selectedRegion === 'daejeon'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              대전광역시
            </button>
            <button
              onClick={() => setSelectedRegion('chungbuk')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                selectedRegion === 'chungbuk'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              충청북도
            </button>
            <button
              onClick={() => setSelectedRegion('chungnam')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                selectedRegion === 'chungnam'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              충청남도
            </button>
          </div>
        </div>

        {/* 지역별 명소 목록 */}
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {getRegionName()} 유명 명소 TOP 5
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              💡 TOP 5는 매월 1일 자동으로 갱신됩니다.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attractions.map((attraction) => {
              const coverPhotoKey = `${selectedRegion}_${attraction.id}`
              const coverPhoto = coverPhotos[coverPhotoKey]
              
              return (
                <div
                  key={attraction.id}
                  onClick={() => onAttractionClick && onAttractionClick(selectedRegion, attraction.id)}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition cursor-pointer"
                >
                  <div className={`relative h-48 ${coverPhoto ? '' : `bg-gradient-to-br ${attraction.color || 'from-blue-400 to-purple-400'} flex items-center justify-center`}`}>
                    {coverPhoto ? (
                      <img src={coverPhoto} alt={attraction.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-6xl">{attraction.emoji || '📍'}</div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded text-xs font-semibold text-gray-700">
                      #{attraction.id}
                    </div>
                  </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {attraction.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {attraction.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-blue-500">
                    <span>📍</span>
                    <span>{attraction.location}</span>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DaejeonChungcheongPage

