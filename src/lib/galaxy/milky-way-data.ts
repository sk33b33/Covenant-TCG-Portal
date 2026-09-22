export type GalaxyArm = {
  name: string;
  angleOffset: number;
  color: string;
  starDensity: number;
  isSolarHome?: boolean;
};

export type GalaxyData = {
  galaxy: string;
  dimensions: {
    radiusLightYears: number;
    coreRadius: number;
    thickness: number;
  };
  majorArms: GalaxyArm[];
};

export const milkyWay: GalaxyData = {
  galaxy: "MilkyWay",
  dimensions: {
    radiusLightYears: 50000,
    coreRadius: 10000,
    thickness: 3000,
  },
  majorArms: [
    { name: "Perseus Arm", angleOffset: 0, color: "#a1c4fd", starDensity: 0.8 },
    { name: "Scutum-Centaurus Arm", angleOffset: 3.14, color: "#ffd1ff", starDensity: 0.8 },
    { name: "Sagittarius Arm", angleOffset: 1.57, color: "#c2fed9", starDensity: 0.5 },
    {
      name: "Orion Cygnus Spur",
      angleOffset: 0.8,
      color: "#fff176",
      starDensity: 0.3,
      isSolarHome: true,
    },
  ],
};
