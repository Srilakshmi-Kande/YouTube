import video from "../Modals/video.js";
import like from "../Modals/like.js";

export const handlelike = async (req,res) => {
    const {userId} = req.body;
    const {videoId} = req.params;
    try {
        const existinglike = await like.findOne({viewer:userId,videoid:videoId})
        if(existinglike){
            await like.findByIdAndDelete(existinglike._id)
            await video.findByIdAndUpdate(videoId,{$inc:{Like: -1}})
            return res.status(200).json({liked:false})
        }else{
            await like.create({viewer:userId,videoid:videoId})
            await video.findByIdAndUpdate(videoId,{$inc:{Like: 1}})
            return res.status(200).json({liked:true})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "Something went wrong"});
    }
}

export const getallLikedVideo = async (req,res) =>{
    const {userId} = req.params;
    try {
        const likedvideo = await like.find({viewer:userId})
        .populate({
            path: "videoid",
            model: "videoFiles"
        })
        .exec();
        return res.status(200).json(likedvideo)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "Something went wrong"});
    }
}