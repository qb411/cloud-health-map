
# AWS Global Health Status Monitor

A real-time dashboard that visualizes the operational status of AWS regions worldwide. This project provides an interactive map interface to monitor AWS service health across different geographical locations.

## Features

- 🗺️ Interactive global map showing all AWS regions
- 🚦 Real-time status monitoring of AWS services
- 🎯 Region-specific status indicators
- 🔄 Auto-refreshing data (updates every minute)
- 🌍 Country flag indicators for each region

## Tech Stack

- React + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui for UI components
- Leaflet.js for interactive maps
- AWS Status RSS feed integration

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone <your-repo-url>

# Navigate to project directory
cd aws-health-monitor

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage

The application will fetch AWS health status data automatically when launched. The map displays interactive markers for each AWS region:

- Green markers indicate operational status
- Yellow markers indicate service issues
- Red markers indicate outages

Click on any marker to see detailed information about that region, including:
- Region name with country flag
- AWS region code
- Current operational status

## Data Updates

The dashboard automatically refreshes its data every 60 seconds to ensure you have the most current AWS health status information.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Data provided by AWS Service Health Dashboard RSS Feed
- Map data © OpenStreetMap contributors
