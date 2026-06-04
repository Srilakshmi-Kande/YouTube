
import watchlater from "../Modals/watchlater.js";

export const handlewatchlater = async (req,res) => {
    const {userId} = req.body;
    const {videoId} = req.params;
    try {
        const existingwatchlater = await watchlater.findOne({viewer:userId,videoid:videoId})
        if(existingwatchlater){
            await watchlater.findByIdAndDelete(existingwatchlater._id)
            return res.status(200).json({watchlater:false})
        }else{
            await watchlater.create({viewer:userId,videoid:videoId})
            return res.status(200).json({watchlater:true})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "Something went wrong"});
    }
}

export const getallwatchlater = async (req,res) =>{
    const {userId} = req.params;
    try {
        const watchlatervideo = await watchlater.find({viewer:userId})
        .populate({
            path: "videoid",
            model: "videoFiles"
        })
        .exec();
        return res.status(200).json(watchlatervideo)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: "Something went wrong"});
    }
}