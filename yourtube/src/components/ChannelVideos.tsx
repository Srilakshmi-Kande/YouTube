import React from 'react'
import Videocard from './Videocard';

const ChannelVideos = ({videos}:any) => {
    if(videos.length === 0){
        return (
            <div className="text-center py-16 border border-dashed rounded-lg">
                <p className="font-medium text-gray-900">No videos yet</p>
                <p className="text-sm text-gray-600 mt-1">Videos you upload will appear here.</p>
            </div>
        );
    }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video : any)=>{
                return <Videocard key={video._id} video={video} />
            })}
        </div>
    </div>
  )
}

export default ChannelVideos
