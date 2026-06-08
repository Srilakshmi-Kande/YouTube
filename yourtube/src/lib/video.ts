export const getVideoUrl = (filepath?: string) => {
  if (!filepath) return "";
  return `${process.env.BACKEND_URL}/${filepath.replace(/\\/g, "/")}`;
};

export const formatVideoDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export const formatViewCount = (views?: number) => {
  const count = views ?? 0;
  return `${count.toLocaleString()} view${count === 1 ? "" : "s"}`;
};
