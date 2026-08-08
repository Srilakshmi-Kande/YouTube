import { isSouthIndianState } from "./regions";

export type AppTheme = "light" | "dark";

export const isMorningWindowIST = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const totalMinutes = hour * 60 + minute;

  return totalMinutes >= 10 * 60 && totalMinutes < 12 * 60;
};

export const computeAppTheme = (state?: string | null): AppTheme => {
  if (isMorningWindowIST() && isSouthIndianState(state)) {
    return "light";
  }
  return "dark";
};

export const getThemeDescription = (state?: string | null) => {
  const morning = isMorningWindowIST();
  const south = isSouthIndianState(state);

  if (morning && south) {
    return "Light theme — South India, 10:00–12:00 PM IST";
  }

  if (!morning && south) {
    return "Dark theme — outside 10:00–12:00 PM IST window";
  }

  if (morning && !south) {
    return "Dark theme — outside South India";
  }

  return "Dark theme — default for your time and location";
};
