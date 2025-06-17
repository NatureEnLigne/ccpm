import Lottie from 'lottie-react'
import noDataAnimation from '../../public/assets/lotties/no_data.json'

interface NoDataAnimationProps {
  message: string
  size?: 'small' | 'medium' | 'large'
}

export default function NoDataAnimation({ message, size = 'medium' }: NoDataAnimationProps) {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24', 
    large: 'w-32 h-32'
  }

  return (
    <div className="h-full flex items-center justify-center text-gray-500">
      <div className="text-center">
        <div className={`${sizeClasses[size]} mx-auto mb-2`}>
          <Lottie 
            animationData={noDataAnimation}
            loop={true}
            autoplay={true}
          />
        </div>
        <p style={{ color: '#d7d7d7' }}>{message}</p>
      </div>
    </div>
  )
} 