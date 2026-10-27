export const SHOP = {
  name: "Filo",
  tagline: "Barbería de barrio",
  address: "Av. Irarrázaval 2850, Ñuñoa",
  phone: "+56 2 2345 6789",
  hours: [
    { days: "Lunes a viernes", time: "10:00 a 20:00" },
    { days: "Sábado", time: "10:00 a 18:00" },
    { days: "Domingo", time: "Cerrado" }
  ],
  cancellationHours: 2,
  bookingDaysAhead: 14
} as const;
