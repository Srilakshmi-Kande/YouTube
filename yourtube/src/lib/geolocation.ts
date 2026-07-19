export const detectUserCity = (): Promise<{ city: string; state?: string } | null> =>
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

          if (city) {
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
