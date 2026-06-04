import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  video: {
    _id: string,
    videotitle: string,
    filepath: string
  }
}

const Videoplayer = ({video}: VideoPlayerProps) => {
    const videos = "/video/vdo.mp4";
    const videoRef = useRef<HTMLVideoElement>(null);
    
  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video ref={videoRef} className='w-full h-full' controls poster={`/placeholder.svg?height=480&width=854`}>
        <source src={`${process.env.BACKEND_URL}/${video.filepath}`} type='video/mp4' />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}

export default Videoplayer
