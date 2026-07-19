import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Languages, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { getLanguageLabel, TRANSLATE_LANGUAGES } from "@/lib/languages";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  userCity?: string;
  commentedon: string;
  likes?: string[];
  dislikes?: string[];
  likeCount?: number;
  dislikeCount?: number;
}

const Comments = ({ videoId }: { videoId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [preferredLang, setPreferredLang] = useState("en");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const { user } = useUser();

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data || []);
      setTranslations({});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
      });
      if (res.data.comment) {
        setComments((prev) => [res.data.comment, ...prev]);
      }
      setNewComment("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim() || !editingCommentId) return;
    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, commentbody: res.data.commentbody } : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
        setTranslations((prev) => {
          const next = { ...prev };
          delete next[editingCommentId];
          return next;
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update comment");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/comment/deletecomment/${id}`);
      setComments((prev) => prev.filter((c) => c._id !== id));
      setTranslations((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleReaction = async (commentId: string, type: "like" | "dislike") => {
    if (!user) {
      toast.error("Sign in to react to comments");
      return;
    }

    try {
      const res = await axiosInstance.post(`/comment/react/${commentId}`, {
        userId: user._id,
        type,
      });

      if (res.data.removed) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        toast.info("Comment removed after receiving 2 dislikes");
        return;
      }

      if (res.data.comment) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? res.data.comment : c))
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not update reaction");
    }
  };

  const handleTranslate = async (comment: Comment) => {
    if (translations[comment._id]) {
      setTranslations((prev) => {
        const next = { ...prev };
        delete next[comment._id];
        return next;
      });
      return;
    }

    setTranslatingId(comment._id);
    try {
      const res = await axiosInstance.post("/comment/translate", {
        text: comment.commentbody,
        targetLang: preferredLang,
      });
      setTranslations((prev) => ({
        ...prev,
        [comment._id]: res.data.translatedText,
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Translation failed");
    } finally {
      setTranslatingId(null);
    }
  };

  const userHasLiked = (comment: Comment) =>
    comment.likes?.some((id) => String(id) === String(user?._id));

  const userHasDisliked = (comment: Comment) =>
    comment.dislikes?.some((id) => String(id) === String(user?._id));

  if (loading) {
    return <div className="text-gray-600 py-4">Loading comments...</div>;
  }

  return (
    <div id="comments-section" className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-semibold">
          {comments.length} Comments
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <Languages className="w-4 h-4 text-gray-500 shrink-0" />
          <label htmlFor="translate-lang" className="text-gray-600 shrink-0">
            Translate to:
          </label>
          <select
            id="translate-lang"
            value={preferredLang}
            onChange={(e) => {
              setPreferredLang(e.target.value);
              setTranslations({});
            }}
            className="border rounded-md px-2 py-1 text-sm bg-white min-w-0"
          >
            {TRANSLATE_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {user && (
        <div className="flex gap-3 sm:gap-4">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 min-w-0">
            {user.city && (
              <p className="text-xs text-gray-500">Posting from {user.city}</p>
            )}
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-20 resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />
            <p className="text-xs text-gray-500">
              Special characters (!@#$%^&*) are not allowed. Any language is welcome.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setNewComment("")}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-3 sm:gap-4 min-w-0">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                <AvatarFallback>{comment.usercommented?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                  <span className="font-medium text-sm">{comment.usercommented}</span>
                  {comment.userCity && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {comment.userCity}
                    </span>
                  )}
                  <span className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                </div>

                {editingCommentId === comment._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button onClick={handleUpdateComment}>Save</Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm break-words">
                      {translations[comment._id] || comment.commentbody}
                    </p>
                    {translations[comment._id] && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Translated to {getLanguageLabel(preferredLang)}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleReaction(comment._id, "like")}
                      >
                        <ThumbsUp
                          className={`w-4 h-4 mr-1 ${
                            userHasLiked(comment) ? "fill-black text-black" : ""
                          }`}
                        />
                        {comment.likeCount ?? comment.likes?.length ?? 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleReaction(comment._id, "dislike")}
                      >
                        <ThumbsDown
                          className={`w-4 h-4 mr-1 ${
                            userHasDisliked(comment) ? "fill-black text-black" : ""
                          }`}
                        />
                        {comment.dislikeCount ?? comment.dislikes?.length ?? 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-gray-600"
                        onClick={() => handleTranslate(comment)}
                        disabled={translatingId === comment._id}
                      >
                        <Languages className="w-4 h-4 mr-1" />
                        {translatingId === comment._id
                          ? "Translating..."
                          : translations[comment._id]
                            ? "Show original"
                            : "Translate"}
                      </Button>

                      {String(comment.userid) === String(user?._id) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-500"
                            onClick={() => handleEdit(comment)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-500"
                            onClick={() => handleDelete(comment._id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
