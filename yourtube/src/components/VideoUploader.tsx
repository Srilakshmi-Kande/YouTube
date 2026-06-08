import { Check, FileVideo, Upload, X } from 'lucide-react';
import React, { ChangeEvent, useRef, useState } from 'react'
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import axiosInstance from '@/lib/axiosinstance';
import { useUser } from '@/lib/AuthContext';

const VideoUploader = ({channelId,channelName,onUploadSuccess}:any) => {
    const { user } = useUser();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoTitle, setVideoTitle] = useState("");
    const [uploadComplete, setUploadComplete] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e : ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if(files && files.length > 0){
            const file = files[0]
            if(!file.type.startsWith("video/")){
                toast.error("Please upload a valid video file");
                return;
            }
            if(file.size > 100*1024*1024){
                toast.error("File size exceeds 100MB limit.");
                return;
            }
            setVideoFile(file);
            const filename = file.name;
            if(!videoTitle){
                setVideoTitle(filename);
            }
        }
    };

    const resetForm = () => {
        setVideoFile(null)
        setVideoTitle("")
        setIsUploading(false)
        setUploadProgress(0)
        setUploadComplete(false)
        if(fileInputRef.current){
            fileInputRef.current.value=""
        }
    }

    const cancelUpload = () => {
        if(isUploading){
            toast.error("Your video upload has been cancelled");
        }
    }

    const handleUpload = async () => {
        if(!videoFile || !videoTitle.trim()){
            toast.error("Please provide file and title");
            return;
        }
        const uploaderId = user?._id || channelId;
        const channelTitle = channelName || user?.channelname;

        if (!uploaderId) {
            toast.error("Channel not ready. Please refresh and try again.");
            return;
        }
        if (!channelTitle) {
            toast.error("Create a channel before uploading videos.");
            return;
        }

        const formdata = new FormData()
        formdata.append("file",videoFile)
        formdata.append("videotitle",videoTitle)
        formdata.append("videochanel",channelTitle)
        formdata.append("uploader",String(uploaderId))
        console.log(formdata)
        try{
            setIsUploading(true)
            setUploadProgress(0)
            const res = await axiosInstance.post("/video/upload",formdata,{
                headers: {
                    "Content-Type": "multipart/form-data", 
                },
                onUploadProgress: (progressEvent : any)=>{
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(progress)
                },
            });
            toast.success("Video uploaded successfully!");
            resetForm();
            onUploadSuccess?.();
        }catch(error){
            console.log(error);
            toast.error("Failed to upload video. Please try again.")
        }finally{
            setIsUploading(false)
        }
    }

  return (
    <div className='bg-gray-50 rounded-lg p-4 sm:p-6'>
      <h2 className='text-lg sm:text-xl font-semibold mb-3 sm:mb-4'>Upload a video</h2>
      <div className='space-y-4'>
        {!videoFile ? (
            <div 
                className='border-2 border-dashed border-gray-300 rounded-lg p-5 sm:p-8 text-center cursor-pointer hover:bg-gray-100 transition-colors'
                onClick={()=>fileInputRef.current?.click()}
            >
                <Upload className='w-12 h-12 mx-auto text-gray-400 mb-2' />
                <p className='text-lg font-medium'>Drag and Drop video files to upload</p>
                <p className='text-sm text-gray-500 mt-1'>or click to select files</p>
                <p className='text-xs text-gray-400 mt-4'>MP4,WebM,MOV or AVI</p>
                <input type="file" ref={fileInputRef} accept='video/*' className='hidden' onChange={handleFileChange} />
            </div>
        ) : (
        <div className='space-y-4'>
            <div className='flex items-center gap-3 p-3 bg-white rounded-lg border'>
                <div className='bg-blue-100 p-2 rounded-md'>
                    <FileVideo className='w-6 h-6 text-blue-600' />
                </div>
                <div className='flex-1 min-w-0'>
                    <p className='font-medium truncate'>{videoFile.name}</p>
                    <p className='text-sm text-gray-500'>{(videoFile.size/(1024 *1024)).toFixed(2)}</p>
                </div>
                {!isUploading && (
                    <Button variant="ghost" size="icon" onClick={cancelUpload}>
                        <X className='w-5 h-5' />
                    </Button>
                )}
                {
                    uploadComplete && (
                        <div className='bg-green-100 p-1 rounded-full'>
                            <Check className='w-5 h-5 text-green-600' />
                        </div>
                    )
                }
            </div>
            <div className='space-y-3'>
                <div>
                    <Label htmlFor='title'>Title (required)</Label>
                    <Input id="title" 
                        value={videoTitle} 
                        onChange={(e)=>setVideoTitle(e.target.value)} 
                        placeholder='Add a title that describes your video'
                        disabled={isUploading || uploadComplete}
                        className='mt-1'
                    />
                </div>
            </div>
            {isUploading && (
                <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className='h-2' />
                </div>
            )}
            <div className='flex justify-end gap-3'>
                {!uploadComplete && (
                    <>
                    <Button onClick={cancelUpload} disabled={uploadComplete}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpload}
                        disabled={isUploading || !videoTitle.trim() || uploadComplete}
                    >
                        {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                    </>
                )}
            </div>
        </div>
    )}
      </div>
    </div>
  )
}

export default VideoUploader
