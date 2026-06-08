import video from "../Modals/video.js";
import users from "../Modals/Auth.js";
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