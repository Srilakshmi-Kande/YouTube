import video from "../Modals/video.js";
export const uploadVideo = async (req,res)=>{
    if(req.file === undefined){
        return res.status(404).json({message: "lz upload a mp4 video file only"})
    }else{
        try {
            const file = new video({
                videotitle: req.body.videotitle,
                filename: req.file.originalname,
                filepath: req.file.path,
                filetype: req.file.mimetype,
                filesize: req.file.size,
                videochanel: req.body.videochanel,
                uploader: req.body.uploader    
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
        const files = await video.find()
        return res.status(200).send(files)
    }catch(error){
        console.log(error)
        return res.status(500).json({message: "Something went wrong"});
    }
}