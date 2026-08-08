import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";

interface OtpDialogProps {
  open: boolean;
  user: any;
  state: string | null;
  channel: "email" | "sms";
  onVerified: (user: any) => void;
  onCancel: () => void;
}

const OtpDialog = ({
  open,
  user,
  state,
  channel,
  onVerified,
  onCancel,
}: OtpDialogProps) => {
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [needsPhone, setNeedsPhone] = useState(channel === "sms" && !user?.phone);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const sentRef = useRef(false);

  const sendOtp = async (phoneNumber?: string) => {
    if (!user?._id || !state) return;

    setSending(true);
    try {
      const res = await axiosInstance.post("/user/otp/send", {
        userId: user._id,
        email: user.email,
        phone: phoneNumber || phone,
        state,
        name: user.name,
      });

      setNeedsPhone(false);
      setDevOtp(res.data.devOtp || null);
      toast.success(res.data.message);
    } catch (error: any) {
      if (error.response?.data?.requiresPhone) {
        setNeedsPhone(true);
        toast.error("Please enter your mobile number to receive OTP");
      } else {
        toast.error(error.response?.data?.message || "Failed to send OTP");
      }
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!open) {
      sentRef.current = false;
      setOtp("");
      setDevOtp(null);
      return;
    }

    if (open && user && state && !needsPhone && !sentRef.current) {
      sentRef.current = true;
      sendOtp();
    }
  }, [open, user?._id, state, needsPhone]);

  const handleVerify = async () => {
    if (!otp.trim()) return;

    setVerifying(true);
    try {
      const res = await axiosInstance.post("/user/otp/verify", {
        userId: user._id,
        otp: otp.trim(),
        phone: phone || undefined,
      });
      toast.success("Verified successfully");
      onVerified(res.data.result || user);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify your login</DialogTitle>
          <DialogDescription>
            {channel === "email"
              ? "South India login — enter the OTP sent to your email."
              : "Enter the OTP sent to your registered mobile number."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {state && (
            <p className="text-sm text-muted-foreground">
              Detected region: <span className="font-medium text-foreground">{state}</span>
            </p>
          )}

          {needsPhone ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={() => sendOtp(phone)}
                disabled={!phone.trim() || sending}
              >
                {sending ? "Sending..." : "Send OTP to mobile"}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">One-time password</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              {devOtp && (
                <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded px-3 py-2">
                  Dev mode OTP: <strong>{devOtp}</strong>
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => sendOtp(phone)}
                  disabled={sending}
                >
                  Resend OTP
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleVerify}
                  disabled={otp.length < 6 || verifying}
                >
                  {verifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OtpDialog;
