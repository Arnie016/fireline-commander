import type { IntakeForm } from "@/lib/schema";

type GuidanceDoc = {
  hazards: IntakeForm["hazard"][];
  region: "metro-manila" | "global";
  summary: string;
  title: string;
  url: string;
};

const guidanceDocs: GuidanceDoc[] = [
  {
    title: "BFP fire safety and evacuation guidance",
    summary:
      "Use fire-service evacuation orders, smoke exposure guidance, and local incident command updates before model-generated routing advice.",
    url: "https://bfp.gov.ph/",
    hazards: ["fire"],
    region: "metro-manila",
  },
  {
    title: "PAGASA severe weather bulletin",
    summary:
      "Monitor severe weather bulletins and heavy rainfall warnings, especially before flooding or typhoon impacts intensify.",
    url: "https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin/",
    hazards: ["typhoon", "flood", "heatwave"],
    region: "metro-manila",
  },
  {
    title: "PHIVOLCS earthquake preparedness",
    summary:
      "Preparedness guidance for earthquake response, aftershocks, and safer movement decisions after major shaking.",
    url: "https://www2.phivolcs.dost.gov.ph/earthquake-preparedness/",
    hazards: ["tsunami"],
    region: "metro-manila",
  },
  {
    title: "PHIVOLCS tsunami readiness communication",
    summary:
      "Community preparedness messaging for tsunami awareness, rapid evacuation, and response planning in coastal areas.",
    url: "https://www.phivolcs.dost.gov.ph/index.php/news/10821-dost-phivolcs-promotes-a-tsunami-ready-ph",
    hazards: ["tsunami"],
    region: "metro-manila",
  },
];

export function getGuidanceDocs(hazard: IntakeForm["hazard"]) {
  return guidanceDocs.filter((doc) => doc.hazards.includes(hazard));
}

export function getHazardPlaybook(hazard: IntakeForm["hazard"]) {
  switch (hazard) {
    case "fire":
      return {
        immediateActions: [
          "Move people away from smoke, heat, and downwind exposure before the fireline reaches the building.",
          "Call or monitor the fire service and follow the incident command perimeter before any shortcut.",
          "Close doors behind evacuating rooms if safe, but do not delay movement to gather belongings.",
          "Account for children, elders, patients, and mobility-limited people at the first safe assembly point.",
          "Do not re-enter for pets, documents, or equipment until firefighters declare the area safe.",
        ],
        destinationReason:
          "Upwind, open assembly areas and official evacuation centers reduce smoke exposure and keep routes clear for fire crews.",
        verificationCadence: "every 10 minutes",
      };
    case "tsunami":
      return {
        immediateActions: [
          "Move inland or to higher ground as soon as shaking stops or an official advisory appears.",
          "Do not wait to see the water. Leave low coastal roads early before congestion builds.",
          "Grab medications, IDs, water, and one charged phone or radio on the way out.",
          "Use text or radio check-ins instead of long calls if the network becomes unstable.",
          "Return only after the official all-clear, because later waves can still be dangerous.",
        ],
        destinationReason:
          "Inland, elevated destinations reduce exposure to coastal inundation and traffic bottlenecks.",
        verificationCadence: "every 20 minutes",
      };
    case "flood":
      return {
        immediateActions: [
          "Move people, medicines, and documents above likely water level now.",
          "Charge phones, lights, and power banks before outages begin.",
          "Switch off electricity only if it is safe and dry to do so.",
          "Evacuate before roads become impassable rather than after water enters the home.",
          "Avoid floodwater contact when possible because it may be contaminated or electrified.",
        ],
        destinationReason:
          "Higher floors or designated evacuation sites reduce exposure to rising water and overnight isolation.",
        verificationCadence: "every 30 minutes",
      };
    case "typhoon":
      return {
        immediateActions: [
          "Monitor the latest severe weather bulletin and local government instructions.",
          "Secure windows, outdoor items, and loose materials that can become hazards.",
          "Prepare lighting, water, food, and a low-bandwidth family contact plan.",
          "Shift transport and evacuation early if your area floods or loses access during strong winds.",
          "Stay inside and away from windows once dangerous winds begin.",
        ],
        destinationReason:
          "Sheltered structures and designated evacuation sites reduce exposure to windborne debris and flood overlap.",
        verificationCadence: "every 30 minutes",
      };
    case "heatwave":
      return {
        immediateActions: [
          "Reduce outdoor exposure during peak heat and move vulnerable people into cooler rooms now.",
          "Hydrate early, not only when someone already feels weak or dizzy.",
          "Check medicines, cooling devices, and backup power for heat-sensitive equipment.",
          "Use shade, fans, cool cloths, and regular buddy checks for children and elders.",
          "Escalate fast if someone shows confusion, fainting, or difficulty breathing.",
        ],
        destinationReason:
          "Cooling centers, shaded public buildings, or backup-powered indoor spaces reduce the risk of heat injury.",
        verificationCadence: "every 60 minutes",
      };
  }
}
