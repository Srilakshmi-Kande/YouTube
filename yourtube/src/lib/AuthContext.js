import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useContext, useState, useEffect, useRef } from "react";
import { createContext } from "react";
import { auth, provider } from "./firebase";
import axiosInstance from "./axiosinstance";
import {
  detectUserLocation,
  saveUserLocation,
  getSavedUserLocation,
} from "./geolocation";
import { getOtpChannelForState } from "./regions";
import OtpDialog from "@/components/OtpDialog";

const UserContext = createContext();

const getOtpSessionKey = (userId) => `otp_verified_${userId}`;

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingState, setPendingState] = useState(null);
  const [otpChannel, setOtpChannel] = useState("email");
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const authFlowRef = useRef(false);
  const signInPopupRef = useRef(false);

  const login = (userdata) => {
    setUser(userdata);
    localStorage.setItem("user", JSON.stringify(userdata));
  };

  const logout = async () => {
    setUser(null);
    setPendingUser(null);
    setShowOtpDialog(false);
    localStorage.removeItem("user");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const syncUserLocation = async (userdata) => {
    if (!userdata?._id) return userdata;

    let location = getSavedUserLocation();
    if (!location?.state) {
      location = await detectUserLocation();
      if (location?.state) saveUserLocation(location);
    }

    if (location?.city || location?.state) {
      try {
        const response = await axiosInstance.patch(`/user/update/${userdata._id}`, {
          city: location.city,
          state: location.state,
        });
        return { ...response.data, state: location.state, city: location.city };
      } catch (error) {
        console.error("Failed to sync location:", error);
      }
    }

    return { ...userdata, state: location?.state, city: location?.city };
  };

  const startOtpVerification = (userdata, state) => {
    const channel = getOtpChannelForState(state);
    setPendingUser(userdata);
    setPendingState(state);
    setOtpChannel(channel);
    setShowOtpDialog(true);
  };

  const completeAuthentication = async (firebaseuser) => {
    if (authFlowRef.current) return;
    authFlowRef.current = true;

    try {
      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image:
          firebaseuser.photoURL ||
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTETU6oOlq2-7Sm_KLEf-N__TGnd7sIyKuz1w&s",
      };

      const response = await axiosInstance.post("/user/login", payload);
      const userdata = await syncUserLocation(response.data.result);
      const state = userdata.state || "Unknown";

      const otpKey = getOtpSessionKey(userdata._id);
      if (sessionStorage.getItem(otpKey) === "true") {
        login(userdata);
        return;
      }

      startOtpVerification(userdata, state);
    } catch (error) {
      console.error(error);
      await logout();
    } finally {
      authFlowRef.current = false;
    }
  };

  const handlegooglesignin = async () => {
    if (signInPopupRef.current) return;
    signInPopupRef.current = true;

    try {
      const result = await signInWithPopup(auth, provider);
      await completeAuthentication(result.user);
    } catch (error) {
      if (error?.code !== "auth/cancelled-popup-request" && error?.code !== "auth/popup-closed-by-user") {
        console.error(error);
      }
    } finally {
      signInPopupRef.current = false;
    }
  };

  const handleOtpVerified = (verifiedUser) => {
    const otpKey = getOtpSessionKey(verifiedUser._id);
    sessionStorage.setItem(otpKey, "true");
    login(verifiedUser);
    setShowOtpDialog(false);
    setPendingUser(null);
    setPendingState(null);
  };

  const handleOtpCancel = async () => {
    setShowOtpDialog(false);
    setPendingUser(null);
    setPendingState(null);
    await logout();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (!firebaseuser) return;

      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (
            parsed._id &&
            sessionStorage.getItem(getOtpSessionKey(parsed._id)) === "true"
          ) {
            setUser(parsed);
            return;
          }
        } catch {
          localStorage.removeItem("user");
        }
      }

      await completeAuthentication(firebaseuser);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async (userId) => {
    try {
      const response = await axiosInstance.get(`/user/${userId}`);
      login(response.data.result);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  return (
    <UserContext.Provider
      value={{ user, login, logout, handlegooglesignin, refreshUser }}
    >
      {children}
      <OtpDialog
        open={showOtpDialog}
        user={pendingUser}
        state={pendingState}
        channel={otpChannel}
        onVerified={handleOtpVerified}
        onCancel={handleOtpCancel}
      />
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
