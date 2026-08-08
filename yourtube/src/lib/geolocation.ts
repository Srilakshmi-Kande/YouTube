export interface UserLocation {
  city?: string;
  state?: string;
}

export const detectUserLocation = (): Promise<UserLocation | null> =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { Accept: "application/json" } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            data.address?.state_district;
          const state = data.address?.state;

          if (city || state) {
            resolve({ city, state });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 10000, maximumAge: 600000 }
    );
  });

export const detectUserCity = detectUserLocation;

export const saveUserLocation = (location: UserLocation) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    "userLocation",
    JSON.stringify({ ...location, updatedAt: Date.now() })
  );
};

export const getSavedUserLocation = (): UserLocation | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("userLocation");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { city: parsed.city, state: parsed.state };
  } catch {
    return null;
  }
};
