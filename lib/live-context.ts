import type { IntakeForm } from "@/lib/schema";

type GeocodeResult = {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
  admin1?: string;
};

type WeatherSnapshot = {
  summary: string;
  headline: string;
};

type DestinationSeed = {
  hazards: IntakeForm["hazard"][];
  latitude: number;
  longitude: number;
  name: string;
  note: string;
};

const fallbackDestinations: DestinationSeed[] = [
  {
    name: "Marikina Sports Center assembly area",
    latitude: 14.6328,
    longitude: 121.0987,
    note: "Open civic space that can act as an upwind assembly and accountability point when local fire command allows movement.",
    hazards: ["fire"],
  },
  {
    name: "Quezon City Memorial Circle open grounds",
    latitude: 14.6507,
    longitude: 121.0494,
    note: "Large open public area with multiple access roads that can keep evacuees away from smoke and response lanes.",
    hazards: ["fire"],
  },
  {
    name: "Quezon Memorial Circle corridor",
    latitude: 14.6507,
    longitude: 121.0494,
    note: "Higher, inland movement option with major roads and public space around Quezon City.",
    hazards: ["tsunami", "flood", "typhoon"],
  },
  {
    name: "UP Diliman academic core",
    latitude: 14.6539,
    longitude: 121.0685,
    note: "Large inland campus area with multiple access roads and open assembly space.",
    hazards: ["tsunami", "flood", "typhoon", "heatwave"],
  },
  {
    name: "Mandaluyong civic corridor",
    latitude: 14.5794,
    longitude: 121.0359,
    note: "Central corridor suitable for regrouping and onward routing away from coastal edges.",
    hazards: ["flood", "typhoon", "heatwave"],
  },
  {
    name: "Antipolo ridge direction",
    latitude: 14.6255,
    longitude: 121.1245,
    note: "Higher-elevation regional movement direction if authorities advise sustained inland relocation.",
    hazards: ["tsunami", "flood"],
  },
];

const fallbackGeocodes: GeocodeResult[] = [
  {
    name: "Marikina",
    admin1: "Metro Manila",
    country: "Philippines",
    latitude: 14.6507,
    longitude: 121.1029,
  },
  {
    name: "Quezon City",
    admin1: "Metro Manila",
    country: "Philippines",
    latitude: 14.676,
    longitude: 121.0437,
  },
  {
    name: "Pasig",
    admin1: "Metro Manila",
    country: "Philippines",
    latitude: 14.5764,
    longitude: 121.0851,
  },
  {
    name: "Manila",
    admin1: "Metro Manila",
    country: "Philippines",
    latitude: 14.5995,
    longitude: 120.9842,
  },
];

const weatherCodes: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  61: "slight rain",
  63: "moderate rain",
  65: "heavy rain",
  80: "rain showers",
  81: "heavy rain showers",
  82: "violent rain showers",
  95: "thunderstorm",
};

export async function geocodeLocation(location: string): Promise<GeocodeResult> {
  const search = new URL("https://geocoding-api.open-meteo.com/v1/search");
  search.searchParams.set("name", location);
  search.searchParams.set("count", "1");
  search.searchParams.set("language", "en");
  search.searchParams.set("format", "json");

  try {
    const response = await fetch(search, {
      next: { revalidate: 0 },
    });
    const data = (await response.json()) as {
      results?: Array<{
        admin1?: string;
        country?: string;
        latitude: number;
        longitude: number;
        name: string;
      }>;
    };

    const match = data.results?.[0];

    if (match) {
      return match;
    }
  } catch {
    // Fall through to local demo geocodes so hackathon walkthroughs still run offline.
  }

  const normalized = location.toLowerCase();
  return (
    fallbackGeocodes.find((place) => normalized.includes(place.name.toLowerCase())) ??
    fallbackGeocodes[0]
  );
}

export async function getWeatherSnapshot(
  latitude: number,
  longitude: number,
): Promise<WeatherSnapshot | null> {
  const search = new URL("https://api.open-meteo.com/v1/forecast");
  search.searchParams.set("latitude", latitude.toString());
  search.searchParams.set("longitude", longitude.toString());
  search.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code",
  );
  search.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
  );
  search.searchParams.set("timezone", "auto");

  try {
    const response = await fetch(search, {
      next: { revalidate: 0 },
    });
    const data = (await response.json()) as {
      current?: {
        apparent_temperature?: number;
        precipitation?: number;
        temperature_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
      daily?: {
        precipitation_probability_max?: number[];
        temperature_2m_max?: number[];
        wind_speed_10m_max?: number[];
      };
    };

    const current = data.current;
    if (!current) {
      return null;
    }

    const code = current.weather_code ?? -1;
    const weatherLabel = weatherCodes[code] ?? "changing conditions";
    const rainChance = data.daily?.precipitation_probability_max?.[0];
    const maxWind = data.daily?.wind_speed_10m_max?.[0];

    return {
      headline: `${weatherLabel}, ${Math.round(current.temperature_2m ?? 0)}°C now`,
      summary: [
        `Current conditions show ${weatherLabel}.`,
        rainChance !== undefined ? `Rain probability today is about ${rainChance}%.` : null,
        maxWind !== undefined ? `Peak wind forecast is about ${Math.round(maxWind)} km/h.` : null,
        current.precipitation !== undefined && current.precipitation > 0
          ? `Precipitation is already registering at ${current.precipitation} mm.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    };
  } catch {
    return null;
  }
}

export function getDestinations(
  latitude: number,
  longitude: number,
  hazard: IntakeForm["hazard"],
) {
  return fallbackDestinations
    .filter((destination) => destination.hazards.includes(hazard))
    .map((destination) => {
      const distanceKm = haversineKm(
        latitude,
        longitude,
        destination.latitude,
        destination.longitude,
      );
      const etaMinutes = Math.max(12, Math.round(distanceKm * 5.5));

      return {
        distanceKm,
        etaMinutes,
        name: destination.name,
        reason: destination.note,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);
}

export function buildRouteContext(
  place: GeocodeResult,
  hazard: IntakeForm["hazard"],
  weakInternet: boolean,
) {
  const lowBandwidthLine = weakInternet
    ? "Keep at least one low-bandwidth fallback such as SMS, radio, or an agreed paper check-in point."
    : "Share the plan before departure so the group can move without relying on live calls.";

  switch (hazard) {
    case "fire":
      return `For ${place.name}, bias movement upwind and away from smoke while keeping response lanes open for fire crews. ${lowBandwidthLine}`;
    case "tsunami":
      return `For ${place.name}, bias movement inland and upward before coastal roads choke. ${lowBandwidthLine}`;
    case "flood":
      return `For ${place.name}, leave before standing water cuts your exit options. ${lowBandwidthLine}`;
    case "typhoon":
      return `For ${place.name}, relocate before wind and rain overlap with transport disruption. ${lowBandwidthLine}`;
    case "heatwave":
      return `For ${place.name}, identify the coolest reachable indoor space and schedule travel outside peak heat windows. ${lowBandwidthLine}`;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radiusKm = 6371;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusKm * c;
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}
