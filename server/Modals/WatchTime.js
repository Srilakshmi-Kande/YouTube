import mongoose from "mongoose";

const watchTimeSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  videoId: { type: String, required: true },
  watchedSeconds: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

watchTimeSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export default mongoose.model("watchtimes", watchTimeSchema);
