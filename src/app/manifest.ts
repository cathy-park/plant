import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Plant Lens - 식물 큐레이션 가이드',
    short_name: 'Plant Lens',
    description: '사진 한 장으로 꽃과 식물의 관리법, 꽃말, 특징을 알아보는 프리미엄 서비스',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9F9F7',
    theme_color: '#E88A8A',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
