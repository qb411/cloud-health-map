
export type AWSRegion = {
  name: string;
  code: string;
  location: [number, number]; // [longitude, latitude]
  status: "operational" | "issue" | "outage";
};

export const awsRegions: AWSRegion[] = [
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
    name: "EU (Ireland)",
    code: "eu-west-1",
    location: [-6.2603, 53.3498],
    status: "operational",
  },
  {
    name: "EU (Frankfurt)",
    code: "eu-central-1",
    location: [8.6821, 50.1109],
    status: "operational",
  },
  {
    name: "EU (London)",
    code: "eu-west-2",
    location: [-0.1276, 51.5074],
    status: "operational",
  },
];
