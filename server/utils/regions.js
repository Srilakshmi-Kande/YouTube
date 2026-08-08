export const SOUTH_INDIAN_STATES = [
  "tamil nadu",
  "kerala",
  "karnataka",
  "andhra pradesh",
  "telangana",
];

export const isSouthIndianState = (state) => {
  if (!state) return false;
  const normalized = state.toLowerCase().trim();
  return SOUTH_INDIAN_STATES.some(
    (southState) =>
      normalized === southState ||
      normalized.includes(southState) ||
      southState.includes(normalized)
  );
};

export const getOtpChannelForState = (state) =>
  isSouthIndianState(state) ? "email" : "sms";
