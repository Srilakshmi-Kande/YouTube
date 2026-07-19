import comment from "../Modals/comment.js";
import users from "../Modals/Auth.js";
import mongoose from "mongoose";
import { formatComment, validateCommentBody } from "../utils/commentValidation.js";

const DISLIKE_REMOVE_THRESHOLD = 2;

export const postcomment = async (req, res) => {
  const { videoid, userid, commentbody, usercommented } = req.body;

  const validation = validateCommentBody(commentbody);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    const user = await users.findById(userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const saved = await comment.create({
      videoid,
      userid,
      commentbody: validation.value,
      usercommented: usercommented || user.name,
      userCity: user.city || "Unknown city",
      likes: [],
      dislikes: [],
    });

    return res.status(201).json({ comment: formatComment(saved) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment
      .find({ videoid })
      .sort({ commentedon: -1 });
    return res.status(200).json(commentvideo.map(formatComment));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const removed = await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: removed });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;

  const validation = validateCommentBody(commentbody);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const updatecomment = await comment.findByIdAndUpdate(
      _id,
      { $set: { commentbody: validation.value } },
      { new: true }
    );
    return res.status(200).json(formatComment(updatecomment));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const reactToComment = async (req, res) => {
  const { id: _id } = req.params;
  const { userId, type } = req.body;

  if (!userId || !["like", "dislike"].includes(type)) {
    return res.status(400).json({ message: "Invalid reaction" });
  }
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Comment not found" });
  }

  try {
    const existing = await comment.findById(_id);
    if (!existing) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const hasLiked = existing.likes.some((id) => String(id) === String(userId));
    const hasDisliked = existing.dislikes.some(
      (id) => String(id) === String(userId)
    );

    let likes = existing.likes.filter((id) => String(id) !== String(userId));
    let dislikes = existing.dislikes.filter(
      (id) => String(id) !== String(userId)
    );

    if (type === "like") {
      if (hasLiked) {
        // toggle off like
      } else {
        likes.push(userObjectId);
      }
    } else if (type === "dislike") {
      if (hasDisliked) {
        // toggle off dislike
      } else {
        dislikes.push(userObjectId);
      }
    }

    if (dislikes.length >= DISLIKE_REMOVE_THRESHOLD) {
      await comment.findByIdAndDelete(_id);
      return res.status(200).json({
        removed: true,
        message: "Comment removed due to dislikes",
      });
    }

    const updated = await comment.findByIdAndUpdate(
      _id,
      { $set: { likes, dislikes } },
      { new: true }
    );

    return res.status(200).json({ comment: formatComment(updated) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const translateComment = async (req, res) => {
  const { text, targetLang } = req.body;

  if (!text?.trim() || !targetLang) {
    return res.status(400).json({ message: "Text and target language required" });
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ message: "Translation failed. Try again." });
    }

    const data = await response.json();
    const translatedText =
      data?.[0]?.map((part) => part?.[0]).join("") || "";

    if (!translatedText) {
      return res.status(502).json({ message: "Translation failed. Try again." });
    }

    return res.status(200).json({
      translatedText,
      targetLang,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Translation service unavailable" });
  }
};
