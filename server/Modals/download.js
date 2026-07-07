import mongoose from "mongoose";

const downloadSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "videoFiles", required: true },
    videotitle: { type: String, required: true },
    filename: { type: String },
    filepath: { type: String, required: true },
    filetype: { type: String },
    videochanel: { type: String, required: true },
    uploader: { type: String },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("downloads", downloadSchema);
