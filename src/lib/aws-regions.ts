export type AWSRegion = {
  name: string;
  code: string;
  location: [number, number]; // [longitude, latitude]
  status: "operational" | "issue" | "outage";
};

export const awsRegions: AWSRegion[] = [
  {
    name: "Africa (Cape Town)",
    code: "af-south-1",
    location: [18.4241, -33.9249],
    status: "operational",
  },
  {
    name: "Asia Pacific (Hong Kong)",
    code: "ap-east-1",
    location: [114.1095, 22.3964],
    status: "operational",
  },
  {
    name: "Asia Pacific (Tokyo)",
    code: "ap-northeast-1",
    location: [139.6917, 35.6895],
    status: "operational",
  },
  {
    name: "Asia Pacific (Seoul)",
    code: "ap-northeast-2",
    location: [126.9780, 37.5665],
    status: "operational",
  },
  {
    name: "Asia Pacific (Osaka)",
    code: "ap-northeast-3",
    location: [135.5023, 34.6937],
    status: "operational",
  },
  {
    name: "Asia Pacific (Mumbai)",
    code: "ap-south-1",
    location: [72.8777, 19.0760],
    status: "operational",
  },
  {
    name: "Asia Pacific (Hyderabad)",
    code: "ap-south-2",
    location: [78.4867, 17.3850],
    status: "operational",
  },
  {
    name: "Asia Pacific (Singapore)",
    code: "ap-southeast-1",
    location: [103.8198, 1.3521],
    status: "operational",
  },
  {
    name: "Asia Pacific (Sydney)",
    code: "ap-southeast-2",
    location: [151.2093, -33.8688],
    status: "operational",
  },
  {
    name: "Asia Pacific (Jakarta)",
    code: "ap-southeast-3",
    location: [106.8456, -6.2088],
    status: "operational",
  },
  {
    name: "Asia Pacific (Melbourne)",
    code: "ap-southeast-4",
    location: [144.9631, -37.8136],
    status: "operational",
  },
  {
    name: "Asia Pacific (Thailand)",
    code: "ap-southeast-5",
    location: [100.5018, 13.7563],
    status: "operational",
  },
  {
    name: "Asia Pacific (Malaysia)",
    code: "ap-southeast-6",
    location: [101.6869, 3.1390],
    status: "operational",
  },
  {
    name: "Canada (Central)",
    code: "ca-central-1",
    location: [-73.5673, 45.5017],
    status: "operational",
  },
  {
    name: "Canada (West)",
    code: "ca-west-1",
    location: [-114.0719, 51.0447], // Updated coordinates for Calgary
    status: "operational",
  },
  {
    name: "China (Beijing)",
    code: "cn-north-1",
    location: [116.4074, 39.9042],
    status: "operational",
  },
  {
    name: "China (Ningxia)",
    code: "cn-northwest-1",
    location: [106.2719, 38.4722],
    status: "operational",
  },
  {
    name: "Europe (Frankfurt)",
    code: "eu-central-1",
    location: [8.6821, 50.1109],
    status: "operational",
  },
  {
    name: "Europe (Zurich)",
    code: "eu-central-2",
    location: [8.5417, 47.3769],
    status: "operational",
  },
  {
    name: "Europe (Stockholm)",
    code: "eu-north-1",
    location: [18.0686, 59.3293],
    status: "operational",
  },
  {
    name: "Europe (Milan)",
    code: "eu-south-1",
    location: [9.1900, 45.4642],
    status: "operational",
  },
  {
    name: "Europe (Spain)",
    code: "eu-south-2",
    location: [-3.7038, 40.4168],
    status: "operational",
  },
  {
    name: "Europe (Ireland)",
    code: "eu-west-1",
    location: [-6.2603, 53.3498],
    status: "operational",
  },
  {
    name: "Europe (London)",
    code: "eu-west-2",
    location: [-0.1276, 51.5074],
    status: "operational",
  },
  {
    name: "Europe (Paris)",
    code: "eu-west-3",
    location: [2.3522, 48.8566],
    status: "operational",
  },
  {
    name: "Israel (Tel Aviv)",
    code: "il-central-1",
    location: [34.7818, 32.0853],
    status: "operational",
  },
  {
    name: "Middle East (UAE)",
    code: "me-central-1",
    location: [55.2708, 25.2048],
    status: "operational",
  },
  {
    name: "Middle East (Bahrain)",
    code: "me-south-1",
    location: [50.5875, 26.2285],
    status: "operational",
  },
  {
    name: "Mexico (Central)",
    code: "mx-central-1",
    location: [-99.1332, 19.4326],
    status: "operational",
  },
  {
    name: "South America (São Paulo)",
    code: "sa-east-1",
    location: [-46.6333, -23.5505],
    status: "operational",
  },
  {
    name: "US East (N. Virginia)",
    code: "us-east-1",
    location: [-77.0369, 38.9072],
    status: "operational",
  },
  {
    name: "US East (Ohio)",
    code: "us-east-2",
    location: [-82.9988, 39.9612],
    status: "operational",
  },
  {
    name: "US West (N. California)",
    code: "us-west-1",
    location: [-122.4194, 37.7749],
    status: "operational",
  },
  {
    name: "US West (Oregon)",
    code: "us-west-2",
    location: [-122.6784, 45.5155],
    status: "operational",
  },
  {
    name: "AWS GovCloud (US-East)",
    code: "us-gov-east-1",
    location: [-77.0369, 38.9072], // Same as us-east-1 since exact location is not public
    status: "operational",
  },
  {
    name: "AWS GovCloud (US-West)",
    code: "us-gov-west-1",
    location: [-122.6784, 45.5155], // Same as us-west-2 since exact location is not public
    status: "operational",
  },
];
