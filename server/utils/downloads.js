export const DOWNLOAD_LIMIT_PER_DAY = 1;

export const getDayKey = (date = new Date()) => date.toISOString().slice(0, 10);

export const canUserDownload = (user, downloadCountToday = 0) => {
  const plan = user?.plan || "free";

  if (plan !== "free") {
    return {
      allowed: true,
      limit: null,
      remaining: null,
      reason: null,
    };
  }

  if (downloadCountToday >= DOWNLOAD_LIMIT_PER_DAY) {
    return {
      allowed: false,
      limit: DOWNLOAD_LIMIT_PER_DAY,
      remaining: 0,
      reason: "limit",
    };
  }

  return {
    allowed: true,
    limit: DOWNLOAD_LIMIT_PER_DAY,
    remaining: DOWNLOAD_LIMIT_PER_DAY - downloadCountToday,
    reason: null,
  };
};
