import mongoose from "mongoose";

const commentschema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videoFiles",
      required: true,
    },
    commentbody: { type: String, required: true },
    usercommented: { type: String },
    userCity: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    commentedon: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("comment", commentschema);
