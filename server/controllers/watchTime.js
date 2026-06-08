import WatchTime from "../Modals/WatchTime.js";
import users from "../Modals/Auth.js";
import { getWatchLimitSeconds } from "../utils/plans.js";

export const getWatchTime = async (req, res) => {
  const { userId, videoId } = req.params;

  try {
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const record = await WatchTime.findOne({ userId, videoId });
    const watchedSeconds = record?.watchedSeconds || 0;
    const limitSeconds = getWatchLimitSeconds(user.plan);

    return res.status(200).json({
      watchedSeconds,
      limitSeconds,
      plan: user.plan,
      isUnlimited: limitSeconds === null,
      remainingSeconds:
        limitSeconds === null ? null : Math.max(0, limitSeconds - watchedSeconds),
    });
  } catch (error) {
    console.error("getWatchTime error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateWatchTime = async (req, res) => {
  const { userId, videoId, watchedSeconds } = req.body;

  if (!userId || !videoId || typeof watchedSeconds !== "number" || watchedSeconds < 0) {
    return res.status(400).json({ message: "Invalid watch time data" });
  }

  try {
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const limitSeconds = getWatchLimitSeconds(user.plan);
    const cappedSeconds =
      limitSeconds === null ? watchedSeconds : Math.min(watchedSeconds, limitSeconds);

    const record = await WatchTime.findOneAndUpdate(
      { userId, videoId },
      { $set: { watchedSeconds: cappedSeconds, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      watchedSeconds: record.watchedSeconds,
      limitSeconds,
      plan: user.plan,
      isUnlimited: limitSeconds === null,
      limitReached: limitSeconds !== null && record.watchedSeconds >= limitSeconds,
      remainingSeconds:
        limitSeconds === null ? null : Math.max(0, limitSeconds - record.watchedSeconds),
    });
  } catch (error) {
    console.error("updateWatchTime error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
