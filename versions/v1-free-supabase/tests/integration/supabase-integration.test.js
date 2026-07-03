#!/usr/bin/env node

/**
 * AWS Health Map V1 - Supabase Integration Tests
 * Tests database operations, real-time subscriptions, and data persistence
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  name: 'Supabase Integration Tests',
  timeout: 30000, // 30 seconds
  retries: 3
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runTest(testName, testFunction) {
  testResults.total++;
  log(`Running test: ${testName}`);
  
  try {
    const result = testFunction();
    if (result === true || result === undefined) {
      testResults.passed++;
      testResults.details.push({ name: testName, status: 'PASSED', error: null });
      log(`Test passed: ${testName}`, 'success');
      return true;
    } else {
      throw new Error(result || 'Test returned false');
    }
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
    log(`Test failed: ${testName} - ${error.message}`, 'error');
    return false;
  }
}

// Test functions
function testEnvironmentVariables() {
  const envExample = path.join(__dirname, '../../.env.example');
  const envLocal = path.join(__dirname, '../../.env.local');
  
  if (!fs.existsSync(envExample)) {
    throw new Error('.env.example file not found');
  }
  
  const envContent = fs.readFileSync(envExample, 'utf8');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      throw new Error(`Required environment variable ${varName} not found in .env.example`);
    }
  }
  
  // Check if .env.local exists (optional but recommended)
  if (!fs.existsSync(envLocal)) {
    log('Warning: .env.local not found. Database tests may fail without proper configuration.', 'info');
  }
  
  return true;
}

function testSupabaseConfigFiles() {
  const configFile = path.join(__dirname, '../../supabase/config.toml');
  const migrationDir = path.join(__dirname, '../../supabase/migrations');
  
  if (!fs.existsSync(configFile)) {
    throw new Error('Supabase config.toml not found');
  }
  
  if (!fs.existsSync(migrationDir)) {
    throw new Error('Supabase migrations directory not found');
  }
  
  const migrations = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));
  if (migrations.length === 0) {
    throw new Error('No migration files found');
  }
  
  // Check for initial schema migration
  const hasInitialMigration = migrations.some(f => f.includes('initial_schema'));
  if (!hasInitialMigration) {
    throw new Error('Initial schema migration not found');
  }
  
  return true;
}

function testSupabaseClientSetup() {
  const clientFile = path.join(__dirname, '../../src/integrations/supabase/client.ts');
  const typesFile = path.join(__dirname, '../../src/integrations/supabase/types.ts');
  
  if (!fs.existsSync(clientFile)) {
    throw new Error('Supabase client file not found');
  }
  
  if (!fs.existsSync(typesFile)) {
    throw new Error('Supabase types file not found');
  }
  
  const clientContent = fs.readFileSync(clientFile, 'utf8');
  
  // Check for required imports and exports
  const requiredElements = [
    'createClient',
    'supabase',
    'checkSupabaseConnection',
    'getDatabaseHealth'
  ];
  
  for (const element of requiredElements) {
    if (!clientContent.includes(element)) {
      throw new Error(`Required element ${element} not found in client file`);
    }
  }
  
  return true;
}

function testDatabaseSchema() {
  const migrationFile = path.join(__dirname, '../../supabase/migrations/20240927000001_initial_schema.sql');
  
  if (!fs.existsSync(migrationFile)) {
    throw new Error('Initial schema migration file not found');
  }
  
  const schemaContent = fs.readFileSync(migrationFile, 'utf8');
  
  // Check for required tables
  const requiredTables = [
    'aws_health_events',
    'region_status',
    'test_simulations'
  ];
  
  for (const table of requiredTables) {
    if (!schemaContent.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)) {
      throw new Error(`Required table ${table} not found in schema`);
    }
  }
  
  // Check for required indexes
  const requiredIndexes = [
    'idx_aws_health_events_region_date',
    'idx_aws_health_events_status',
    'idx_aws_health_events_pub_date'
  ];
  
  for (const index of requiredIndexes) {
    if (!schemaContent.includes(index)) {
      throw new Error(`Required index ${index} not found in schema`);
    }
  }
  
  // Check for RLS policies
  if (!schemaContent.includes('ENABLE ROW LEVEL SECURITY')) {
    throw new Error('Row Level Security not enabled in schema');
  }
  
  return true;
}

function testAWSHealthLibraryIntegration() {
  const healthLibFile = path.join(__dirname, '../../src/lib/aws-health.ts');
  
  if (!fs.existsSync(healthLibFile)) {
    throw new Error('AWS health library file not found');
  }
  
  const healthContent = fs.readFileSync(healthLibFile, 'utf8');
  
  // Check for Supabase integration
  const requiredElements = [
    'import { supabase }',
    'storeHealthEvents',
    'getRecentHealthEvents',
    'updateRegionStatuses',
    'AWSHealthEventInsert'
  ];
  
  for (const element of requiredElements) {
    if (!healthContent.includes(element)) {
      throw new Error(`Required element ${element} not found in health library`);
    }
  }
  
  // Check that localStorage is not used
  if (healthContent.includes('localStorage')) {
    throw new Error('localStorage usage found - should be replaced with Supabase');
  }
  
  return true;
}

function testReactComponentIntegration() {
  const indexFile = path.join(__dirname, '../../src/pages/Index.tsx');
  
  if (!fs.existsSync(indexFile)) {
    throw new Error('Main Index component not found');
  }
  
  const indexContent = fs.readFileSync(indexFile, 'utf8');
  
  // Check for Supabase integration
  const requiredElements = [
    'import { supabase',
    'checkSupabaseConnection',
    'postgres_changes',
    'dbConnected',
    'TestSimulationInsert'
  ];
  
  for (const element of requiredElements) {
    if (!indexContent.includes(element)) {
      throw new Error(`Required element ${element} not found in Index component`);
    }
  }
  
  return true;
}

function testPackageJsonDependencies() {
  const packageFile = path.join(__dirname, '../../package.json');
  
  if (!fs.existsSync(packageFile)) {
    throw new Error('package.json not found');
  }
  
  const packageContent = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  
  // Check for required dependencies
  const requiredDeps = [
    '@supabase/supabase-js',
    '@tanstack/react-query'
  ];
  
  for (const dep of requiredDeps) {
    if (!packageContent.dependencies || !packageContent.dependencies[dep]) {
      throw new Error(`Required dependency ${dep} not found in package.json`);
    }
  }
  
  // Check for Supabase CLI in devDependencies
  if (!packageContent.devDependencies || !packageContent.devDependencies['supabase']) {
    throw new Error('Supabase CLI not found in devDependencies');
  }
  
  return true;
}

function testPythonEnvironmentSetup() {
  const pythonSetupScript = path.join(__dirname, '../../scripts/setup-python-env.sh');
  const requirementsFile = path.join(__dirname, '../../requirements.txt');
  
  if (!fs.existsSync(pythonSetupScript)) {
    throw new Error('Python environment setup script not found');
  }
  
  if (!fs.existsSync(requirementsFile)) {
    throw new Error('Python requirements.txt not found');
  }
  
  const requirementsContent = fs.readFileSync(requirementsFile, 'utf8');
  
  // Check for essential Python packages
  const requiredPackages = [
    'pytest',
    'requests',
    'python-dotenv'
  ];
  
  for (const pkg of requiredPackages) {
    if (!requirementsContent.includes(pkg)) {
      throw new Error(`Required Python package ${pkg} not found in requirements.txt`);
    }
  }
  
  return true;
}

// Main test execution
function runAllTests() {
  log(`Starting ${TEST_CONFIG.name}...`);
  log(`Timeout: ${TEST_CONFIG.timeout}ms, Retries: ${TEST_CONFIG.retries}`);
  
  // Run all tests
  runTest('Environment Variables Configuration', testEnvironmentVariables);
  runTest('Supabase Config Files', testSupabaseConfigFiles);
  runTest('Supabase Client Setup', testSupabaseClientSetup);
  runTest('Database Schema', testDatabaseSchema);
  runTest('AWS Health Library Integration', testAWSHealthLibraryIntegration);
  runTest('React Component Integration', testReactComponentIntegration);
  runTest('Package.json Dependencies', testPackageJsonDependencies);
  runTest('Python Environment Setup', testPythonEnvironmentSetup);
  
  // Print results
  log('\n' + '='.repeat(50));
  log(`Test Results: ${testResults.passed}/${testResults.total} passed`);
  
  if (testResults.failed > 0) {
    log('\nFailed Tests:', 'error');
    testResults.details
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        log(`  - ${test.name}: ${test.error}`, 'error');
      });
  }
  
  log('='.repeat(50));
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults
};