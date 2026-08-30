import dynamic from 'next/dynamic'
import React from 'react'

/**
 * /pack-test — isolated harness for the 3D pack reveal.
 * The pack section + tall spacers so the pinned scroll animation has room.
 */
const PackReveal = dynamic(() => import('../components/PackReveal'), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-white" />,
})

const PackTestPage: React.FC = () => {
  return (
    <>
      <div className="flex h-[50vh] items-center justify-center bg-neutral-100 text-sm text-neutral-500">
        scroll down ↓
      </div>
      <PackReveal sectionId="pack" />
      <div className="flex h-[80vh] items-center justify-center bg-neutral-100 text-sm text-neutral-500">
        after the pack
      </div>
    </>
  )
}

export default PackTestPage
