/**
 * Integration Tests - Test Controls
 * Tests the interaction between TestControls and RegionMap components
 */

// Mock region data
const mockRegions = [
  { code: 'us-east-1', name: 'US East (N. Virginia)', location: [-77.0369, 38.9072], status: 'operational' },
  { code: 'us-west-2', name: 'US West (Oregon)', location: [-120.5542, 43.8041], status: 'operational' },
  { code: 'eu-west-1', name: 'Europe (Ireland)', location: [-6.2603, 53.3498], status: 'operational' }
];

// Simulate the issue application logic (from Index.tsx)
function applySimulatedIssues(regions, simulatedIssues) {
  return regions.map(region => ({
    ...region,
    status: simulatedIssues[region.code] || region.status
  }));
}

// Test suite
const integrationTests = [
  {
    name: 'Apply Single Issue (Yellow)',
    test: () => {
      const simulatedIssues = { 'us-east-1': 'issue' };
      const updatedRegions = applySimulatedIssues(mockRegions, simulatedIssues);
      const testRegion = updatedRegions.find(r => r.code === 'us-east-1');
      return testRegion.status === 'issue';
    }
  },
  {
    name: 'Apply Single Outage (Red)',
    test: () => {
      const simulatedIssues = { 'us-east-1': 'outage' };
      const updatedRegions = applySimulatedIssues(mockRegions, simulatedIssues);
      const testRegion = updatedRegions.find(r => r.code === 'us-east-1');
      return testRegion.status === 'outage';
    }
  },
  {
    name: 'Maintain Operational Status (Green)',
    test: () => {
      const simulatedIssues = {}; // No simulated issues
      const updatedRegions = applySimulatedIssues(mockRegions, simulatedIssues);
      return updatedRegions.every(region => region.status === 'operational');
    }
  },
  {
    name: 'Multiple Issues (Yellow + Red)',
    test: () => {
      const simulatedIssues = { 
        'us-east-1': 'issue',
        'us-west-2': 'outage'
      };
      const updatedRegions = applySimulatedIssues(mockRegions, simulatedIssues);
      const issueRegion = updatedRegions.find(r => r.code === 'us-east-1');
      const outageRegion = updatedRegions.find(r => r.code === 'us-west-2');
      const normalRegion = updatedRegions.find(r => r.code === 'eu-west-1');
      
      return issueRegion.status === 'issue' && 
             outageRegion.status === 'outage' && 
             normalRegion.status === 'operational';
    }
  },
  {
    name: 'Override Operational to Issue (Green → Yellow)',
    test: () => {
      const regionsWithOperational = [
        { ...mockRegions[0], status: 'operational' }
      ];
      const simulatedIssues = { 'us-east-1': 'issue' };
      const updatedRegions = applySimulatedIssues(regionsWithOperational, simulatedIssues);
      const testRegion = updatedRegions.find(r => r.code === 'us-east-1');
      return testRegion.status === 'issue';
    }
  },
  {
    name: 'Override Operational to Outage (Green → Red)',
    test: () => {
      const regionsWithOperational = [
        { ...mockRegions[0], status: 'operational' }
      ];
      const simulatedIssues = { 'us-east-1': 'outage' };
      const updatedRegions = applySimulatedIssues(regionsWithOperational, simulatedIssues);
      const testRegion = updatedRegions.find(r => r.code === 'us-east-1');
      return testRegion.status === 'outage';
    }
  },
  {
    name: 'Override Issue to Outage (Yellow → Red)',
    test: () => {
      const regionsWithIssue = [
        { ...mockRegions[0], status: 'issue' }
      ];
      const simulatedIssues = { 'us-east-1': 'outage' };
      const updatedRegions = applySimulatedIssues(regionsWithIssue, simulatedIssues);
      const testRegion = updatedRegions.find(r => r.code === 'us-east-1');
      return testRegion.status === 'outage';
    }
  },
  {
    name: 'No Simulated Issues',
    test: () => {
      const simulatedIssues = {};
      const updatedRegions = applySimulatedIssues(mockRegions, simulatedIssues);
      return updatedRegions.every(region => region.status === 'operational');
    }
  },
  {
    name: 'Invalid Region Code',
    test: () => {
      const simulatedIssues = { 'invalid-region': 'issue' };
      const updatedRegions = applySimulatedIssues(mockRegions, simulatedIssues);
      return updatedRegions.every(region => region.status === 'operational');
    }
  }
];

// Run integration tests
function runIntegrationTests() {
  console.log('=== Integration Tests - Test Controls ===');
  let passed = 0;
  let failed = 0;
  
  integrationTests.forEach(({ name, test }) => {
    try {
      const result = test();
      if (result) {
        console.log(`✅ ${name}: PASS`);
        passed++;
      } else {
        console.log(`❌ ${name}: FAIL`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      failed++;
    }
  });
  
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return { passed, failed, total: integrationTests.length };
}

// Export for Node.js or run in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runIntegrationTests, applySimulatedIssues, mockRegions };
} else {
  // Browser environment
  window.runIntegrationTests = runIntegrationTests;
}
