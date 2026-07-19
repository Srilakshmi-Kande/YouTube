const BLOCKED_SPECIAL_CHARS = /[!@#$%^&*()_+=\[\]{}|\\:;"'<>/?~`]/;

export const validateCommentBody = (text) => {
  const trimmed = text?.trim();
  if (!trimmed) {
    return { valid: false, message: "Comment cannot be empty" };
  }
  if (BLOCKED_SPECIAL_CHARS.test(trimmed)) {
    return {
      valid: false,
      message:
        "Comments cannot contain special characters (!@#$%^&* etc.). Use letters, numbers, and spaces only.",
    };
  }
  return { valid: true, value: trimmed };
};

export const formatComment = (doc) => {
  const comment = doc.toObject ? doc.toObject() : doc;
  return {
    ...comment,
    likeCount: comment.likes?.length || 0,
    dislikeCount: comment.dislikes?.length || 0,
  };
};
