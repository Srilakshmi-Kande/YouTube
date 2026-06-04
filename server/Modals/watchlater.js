import mongoose from "mongoose";
const watchlaterschema = mongoose.Schema({
    viewer: {type: mongoose.Schema.Types.ObjectId,ref:"user", required: true},
    videoid: {type: mongoose.Schema.Types.ObjectId,ref:"videoFiles",required: true},
    watchedon: {type: Date, default:Date.now},
},{
    timestamps: true
})

export default mongoose.model("watchlater", watchlaterschema);
