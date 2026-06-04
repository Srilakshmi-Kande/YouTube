import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import React from 'react'

const videos="/video/vdo.mp4";

const Videocard = ({video}:any) => {
   
  return (
    <Link href={`/watch/${video._id}`} className="group">
        <div className="space-y-3">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <video src={`${process.env.BACKEND_URL}/${video.filepath}`} className="object-cover group-hover:scale-105 transition-transform duration-200" />
                <div className='absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded'>
                    10:24
                </div>
            </div>
            <div className="flex gap-3">
                <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src="/placeholder.svg?height=36&width=36" />
                    <AvatarFallback>{video.videochanel?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h3 className='text-sm font-medium line-clamp-2 group-hover:text-blue-600'>
                        {video.videotitle}
                    </h3>
                    <p className='text-sm text-gray-600 mt-1'>{video.videochanel}</p>
                    <p className="text-sm text-gray-600">
                        {video.views.toLocaleString()} views •{" "}
                        {formatDistanceToNow(new Date(video.createdAt))} ago
                    </p>
                </div>
            </div>
        </div>
    </Link>
  )
}

export default Videocard
