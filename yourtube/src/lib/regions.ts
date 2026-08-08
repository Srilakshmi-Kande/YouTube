export const SOUTH_INDIAN_STATES = [
  "tamil nadu",
  "kerala",
  "karnataka",
  "andhra pradesh",
  "telangana",
];

export const isSouthIndianState = (state?: string | null) => {
  if (!state) return false;
  const normalized = state.toLowerCase().trim();
  return SOUTH_INDIAN_STATES.some(
    (southState) =>
      normalized === southState ||
      normalized.includes(southState) ||
      southState.includes(normalized)
  );
};

export const getOtpChannelForState = (state?: string | null) =>
  isSouthIndianState(state) ? "email" : "sms";
