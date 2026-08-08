export const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

export const getOtpExpiry = () => new Date(Date.now() + 10 * 60 * 1000);
