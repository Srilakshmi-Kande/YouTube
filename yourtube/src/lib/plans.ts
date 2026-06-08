export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    watchLimitMinutes: 5,
    description: "Watch up to 5 minutes per video",
  },
  bronze: {
    id: "bronze",
    name: "Bronze",
    price: 10,
    watchLimitMinutes: 7,
    description: "Watch up to 7 minutes per video",
  },
  silver: {
    id: "silver",
    name: "Silver",
    price: 50,
    watchLimitMinutes: 10,
    description: "Watch up to 10 minutes per video",
  },
  gold: {
    id: "gold",
    name: "Gold",
    price: 100,
    watchLimitMinutes: null,
    description: "Unlimited video watching",
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const PAID_PLAN_IDS: PlanId[] = ["bronze", "silver", "gold"];

export const formatWatchLimit = (planId: string) => {
  const plan = PLANS[planId as PlanId] || PLANS.free;
  if (plan.watchLimitMinutes === null) return "Unlimited";
  return `${plan.watchLimitMinutes} min / video`;
};
