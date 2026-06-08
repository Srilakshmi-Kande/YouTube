import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { PAID_PLAN_IDS, PLANS, PlanId, formatWatchLimit } from "@/lib/plans";
import { Check, Crown } from "lucide-react";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Premium = () => {
  const { user, login, handlegooglesignin } = useUser();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const autoUpgradeRef = useRef(false);

  const currentPlan = (user?.plan as PlanId) || "free";

  const handleUpgrade = useCallback(
    async (planId: PlanId) => {
      if (!user?._id) {
        toast.error("Please sign in to upgrade your plan");
        handlegooglesignin();
        return;
      }

      if (planId === "free") return;

      setLoadingPlan(planId);
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error("Failed to load payment gateway");
          return;
        }

        const orderRes = await axiosInstance.post("/payment/create-order", {
          userId: user._id,
          planId,
        });

        const { orderId, amount, currency, keyId, planName } = orderRes.data;

        const options = {
          key: keyId,
          amount,
          currency,
          name: "Yourtube",
          description: `${planName} plan upgrade`,
          order_id: orderId,
          prefill: {
            name: user.name,
            email: user.email,
          },
          theme: { color: "#dc2626" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await axiosInstance.post("/payment/verify", {
                userId: user._id,
                planId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              login(verifyRes.data.result);
              toast.success(`Upgraded to ${planName}! Check your email for the invoice.`);
            } catch {
              toast.error("Payment verification failed");
            }
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (error: unknown) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Payment could not be started";
        toast.error(message);
      } finally {
        setLoadingPlan(null);
      }
    },
    [user, login, handlegooglesignin]
  );

  useEffect(() => {
    const plan = router.query.plan as string;
    if (
      !autoUpgradeRef.current &&
      plan &&
      PAID_PLAN_IDS.includes(plan as PlanId) &&
      user?._id
    ) {
      autoUpgradeRef.current = true;
      handleUpgrade(plan as PlanId);
    }
  }, [router.query.plan, user?._id, handleUpgrade]);

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 min-w-0">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-500 shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold">Premium Plans</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          Upgrade your plan for longer watch time and more features.
          {user && (
            <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0 font-medium text-gray-900">
              Current plan: {PLANS[currentPlan]?.name || "Free"}
            </span>
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(PLANS).map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isPaid = plan.id !== "free";

            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-5 flex flex-col ${
                  plan.id === "gold"
                    ? "border-yellow-400 bg-yellow-50"
                    : isCurrent
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 bg-white"
                }`}
              >
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="text-3xl font-bold mt-2">
                  {plan.price === 0 ? "Free" : `₹${plan.price}`}
                </p>
                <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                <p className="text-sm font-medium mt-3">{formatWatchLimit(plan.id)}</p>

                <ul className="mt-4 space-y-2 text-sm flex-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    {formatWatchLimit(plan.id)} watching
                  </li>
                  {isPaid && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Email invoice on purchase
                    </li>
                  )}
                </ul>

                <div className="mt-5">
                  {isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Current plan
                    </Button>
                  ) : plan.id === "free" ? (
                    <Button variant="outline" className="w-full" disabled>
                      Default plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={loadingPlan === plan.id}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {loadingPlan === plan.id ? "Processing..." : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!user && (
          <p className="text-center text-gray-600 mt-8">
            <Button variant="link" onClick={handlegooglesignin} className="text-red-600">
              Sign in
            </Button>{" "}
            to upgrade your plan.
          </p>
        )}
      </div>
    </main>
  );
};

export default Premium;
