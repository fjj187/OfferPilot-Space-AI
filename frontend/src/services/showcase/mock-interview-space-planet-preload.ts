import type { CSSProperties } from 'vue'

export interface MockInterviewSpacePlanetTextureConfig {
  fitMode?: 'cover' | 'contain'
  imageStyle?: CSSProperties
  src: string
}

export const mockInterviewSpacePlanetTextureMap = {
  overview: {
    src: `${ import.meta.env.BASE_URL }DroitStock_630232299_Medium.jpg`,
    imageStyle: {
      objectPosition: '50% 46%',
      transform: 'translate(-50%, -50%) scale(2.18)',
      filter: 'saturate(1.08) contrast(1.28) brightness(0.92)'
    }
  },
  mock: {
    src: `${ import.meta.env.BASE_URL }DroitStock_1493827434_Medium.jpg`,
    imageStyle: {
      objectPosition: '50% 50%',
      transform: 'translate(-50%, -50%) scale(1.1)',
      filter: 'saturate(1.08) contrast(1.04) brightness(1.02)'
    }
  },
  library: {
    src: `${ import.meta.env.BASE_URL }DroitStock_923338027_Medium.jpg`,
    imageStyle: {
      objectPosition: '45% 48%',
      transform: 'translate(-50%, -50%) scale(1.38)',
      filter: 'saturate(1.06) contrast(1.08) brightness(0.96)'
    }
  },
  feedback: {
    src: `${ import.meta.env.BASE_URL }PIA18033~orig.jpg`,
    imageStyle: {
      objectPosition: '50% 52%',
      transform: 'translate(-50%, -50%) scale(1.22)',
      filter: 'saturate(1.12) contrast(1.08) brightness(1.03)'
    }
  },
  report: {
    src: `${ import.meta.env.BASE_URL }DroitStock_55808438_Medium.jpg`,
    imageStyle: {
      objectPosition: '50% 54%',
      transform: 'translate(-50%, -50%) scale(1.48)',
      filter: 'saturate(1.1) contrast(1.08) brightness(1)'
    }
  }
} satisfies Record<string, MockInterviewSpacePlanetTextureConfig>

const mockInterviewSpacePlanetTextureSources = Object.values(mockInterviewSpacePlanetTextureMap).map(item => item.src)

let planetTexturePreloadPromise: Promise<void> | null = null
let planetTexturesReady = false

const preloadImage = (src: string) => {
  return new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    const image = new Image()
    image.src = src

    const finish = () => resolve()

    image.onload = () => {
      if (typeof image.decode === 'function') {
        image.decode().catch(() => undefined).finally(finish)
        return
      }

      finish()
    }

    image.onerror = finish
  })
}

export const areMockInterviewSpacePlanetTexturesReady = () => planetTexturesReady

export const preloadMockInterviewSpacePlanetTextures = () => {
  if (planetTexturesReady) {
    return Promise.resolve()
  }

  planetTexturePreloadPromise ||= Promise.all(
    mockInterviewSpacePlanetTextureSources.map(preloadImage)
  ).then(() => {
    planetTexturesReady = true
  })

  return planetTexturePreloadPromise
}
