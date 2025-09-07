/**
 * Unit Tests - Status Mapping Functions
 * Tests core status color and CSS class mapping logic
 */

// Status color mapping function (from RegionMap.tsx)
function getStatusColor(status) {
  switch (status) {
    case "operational":
      return { fill: '#10B981', border: '#059669' }; // Green
    case "issue":
      return { fill: '#F59E0B', border: '#D97706' }; // Yellow/Orange
    case "outage":
      return { fill: '#EF4444', border: '#DC2626' }; // Red
    default:
      return { fill: '#10B981', border: '#059669' }; // Default to green
  }
}

// CSS class mapping function (from RegionMap.tsx)
function getStatusBadgeClass(status) {
  switch (status) {
    case 'operational':
      return 'bg-emerald-100 text-emerald-800';
    case 'issue':
      return 'bg-amber-100 text-amber-800';
    case 'outage':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-emerald-100 text-emerald-800';
  }
}

// Test suite
const tests = [
  {
    name: 'Operational Status Color (Green)',
    test: () => {
      const colors = getStatusColor('operational');
      return colors.fill === '#10B981' && colors.border === '#059669';
    }
  },
  {
    name: 'Issue Status Color (Yellow)',
    test: () => {
      const colors = getStatusColor('issue');
      return colors.fill === '#F59E0B' && colors.border === '#D97706';
    }
  },
  {
    name: 'Outage Status Color (Red)',
    test: () => {
      const colors = getStatusColor('outage');
      return colors.fill === '#EF4444' && colors.border === '#DC2626';
    }
  },
  {
    name: 'Default Status Color (Green Fallback)',
    test: () => {
      const colors = getStatusColor('unknown');
      return colors.fill === '#10B981' && colors.border === '#059669';
    }
  },
  {
    name: 'Operational CSS Classes (Green)',
    test: () => {
      const classes = getStatusBadgeClass('operational');
      return classes.includes('emerald');
    }
  },
  {
    name: 'Issue CSS Classes (Yellow)',
    test: () => {
      const classes = getStatusBadgeClass('issue');
      return classes.includes('amber');
    }
  },
  {
    name: 'Outage CSS Classes (Red)',
    test: () => {
      const classes = getStatusBadgeClass('outage');
      return classes.includes('red');
    }
  },
  {
    name: 'Color Consistency Check',
    test: () => {
      const operational = getStatusColor('operational');
      const issue = getStatusColor('issue');
      const outage = getStatusColor('outage');
      
      // Ensure all colors are different
      return operational.fill !== issue.fill && 
             issue.fill !== outage.fill && 
             operational.fill !== outage.fill;
    }
  }
];

// Run tests
function runUnitTests() {
  console.log('=== Unit Tests - Status Mapping ===');
  let passed = 0;
  let failed = 0;
  
  tests.forEach(({ name, test }) => {
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
  return { passed, failed, total: tests.length };
}

// Export for Node.js or run in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runUnitTests, getStatusColor, getStatusBadgeClass };
} else {
  // Browser environment
  window.runUnitTests = runUnitTests;
}
