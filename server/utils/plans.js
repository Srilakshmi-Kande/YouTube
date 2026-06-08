export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    watchLimitSeconds: 5 * 60,
    description: "Watch up to 5 minutes per video",
  },
  bronze: {
    id: "bronze",
    name: "Bronze",
    price: 10,
    amountInPaise: 1000,
    watchLimitSeconds: 7 * 60,
    description: "Watch up to 7 minutes per video",
  },
  silver: {
    id: "silver",
    name: "Silver",
    price: 50,
    amountInPaise: 5000,
    watchLimitSeconds: 10 * 60,
    description: "Watch up to 10 minutes per video",
  },
  gold: {
    id: "gold",
    name: "Gold",
    price: 100,
    amountInPaise: 10000,
    watchLimitSeconds: null,
    description: "Unlimited video watching",
  },
};

export const PAID_PLANS = ["bronze", "silver", "gold"];

export const getWatchLimitSeconds = (planId) => {
  const plan = PLANS[planId] || PLANS.free;
  return plan.watchLimitSeconds;
};

export const getPlanDetails = (planId) => PLANS[planId] || PLANS.free;
