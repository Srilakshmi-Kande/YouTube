import path from "path";
import fs from "fs";
import video from "../Modals/video.js";
import users from "../Modals/Auth.js";
import Download from "../Modals/download.js";
import { canUserDownload, getDayKey } from "../utils/downloads.js";

export const uploadVideo = async (req,res)=>{
    if(req.file === undefined){
        return res.status(404).json({message: "lz upload a mp4 video file only"})
    }else{
        try {
            const file = new video({
                videotitle: req.body.videotitle,
                filename: req.file.originalname,
                filepath: req.file.path.replace(/\\/g, "/"),
                filetype: req.file.mimetype,
                filesize: req.file.size,
                videochanel: req.body.videochanel,
                uploader: String(req.body.uploader || "")
            })
            await file.save();
            return res.status(201).json("File uploaded successfully");
        } catch (error) {
            console.log("logon error",error)
            return res.status(500).json({message: "Something went wrong"});
        }
    }
};
export const getallvideo = async (req,res) => {
    try{
        const files = await video.find().sort({ createdAt: -1 })
        return res.status(200).send(files)
    }catch(error){
        console.log(error)
        return res.status(500).json({message: "Something went wrong"});
    }
}

export const getVideosByChannel = async (req, res) => {
    const { channelId } = req.params;
    try {
        const channelUser = await users.findById(channelId);
        const filters = [{ uploader: String(channelId) }];

        if (channelUser?.channelname) {
            filters.push({ videochanel: channelUser.channelname });
        }

        const files = await video.find({ $or: filters }).sort({ createdAt: -1 });
        const uniqueVideos = [
            ...new Map(files.map((item) => [String(item._id), item])).values(),
        ];

        return res.status(200).json(uniqueVideos);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const downloadVideo = async (req, res) => {
    const { videoId } = req.params;
    const { userId } = req.body;

    if (!videoId) {
        return res.status(400).json({ message: "Video id is required" });
    }

    try {
        const videoDoc = await video.findById(videoId);
        if (!videoDoc) {
            return res.status(404).json({ message: "Video not found" });
        }

        let user = null;
        if (userId) {
            user = await users.findById(userId);
        }

        if (!user) {
            return res.status(401).json({ message: "Sign in to download videos" });
        }

        const downloadCountToday = await Download.countDocuments({
            userId: user._id,
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        });

        const permission = canUserDownload(user, downloadCountToday);
        if (!permission.allowed) {
            return res.status(403).json({
                message: "Daily download limit reached. Upgrade to premium for unlimited downloads.",
                allowed: false,
                limit: permission.limit,
                remaining: permission.remaining,
            });
        }

        const downloadRecord = await Download.create({
            userId: user._id,
            videoId: videoDoc._id,
            videotitle: videoDoc.videotitle,
            filename: videoDoc.filename,
            filepath: videoDoc.filepath,
            filetype: videoDoc.filetype,
            videochanel: videoDoc.videochanel,
            uploader: videoDoc.uploader,
            views: videoDoc.views,
        });

        const filePath = path.resolve(videoDoc.filepath);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Downloaded file is not available" });
        }

        res.download(filePath, videoDoc.filename || `${videoDoc.videotitle}.mp4`);
        return;
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const getUserDownloads = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ message: "User id is required" });
    }

    try {
        const downloads = await Download.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json(downloads);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const deleteDownload = async (req, res) => {
    const { downloadId } = req.params;
    const userId = req?.body?.userId || req?.query?.userId;

    if (!downloadId) {
        return res.status(400).json({ message: "Download id is required" });
    }

    try {
        const download = await Download.findById(downloadId);
        if (!download) {
            return res.status(404).json({ message: "Download not found" });
        }

        if (userId && String(download.userId) !== String(userId)) {
            return res.status(403).json({ message: "You can only remove your own downloads" });
        }

        await Download.findByIdAndDelete(downloadId);
        return res.status(200).json({ message: "Download removed" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};