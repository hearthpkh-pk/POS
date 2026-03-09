#!/usr/bin/env node

// Build Script - Me POS by Mein Licht
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔧 ${description}`, 'cyan');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    process.exit(1);
  }
}

function checkEnvironment() {
  log('🔍 Checking environment...', 'yellow');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    log(`❌ Node.js version ${nodeVersion} is not supported. Please use Node.js 16 or higher.`, 'red');
    process.exit(1);
  }
  
  log(`✅ Node.js version: ${nodeVersion}`, 'green');
  
  // Check if package.json exists
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    log('❌ package.json not found', 'red');
    process.exit(1);
  }
  
  log('✅ package.json found', 'green');
  
  // Check if node_modules exists
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('⚠️  node_modules not found, running npm install...', 'yellow');
    runCommand('npm install', 'Installing dependencies');
  } else {
    log('✅ node_modules found', 'green');
  }
}

function cleanBuild() {
  log('🧹 Cleaning previous build...', 'yellow');
  
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    log('✅ Cleaned dist directory', 'green');
  }
}

function runTests() {
  if (process.argv.includes('--skip-tests')) {
    log('⏭️  Skipping tests', 'yellow');
    return;
  }
  
  runCommand('npm test', 'Running tests');
}

function lintCode() {
  if (process.argv.includes('--skip-lint')) {
    log('⏭️  Skipping linting', 'yellow');
    return;
  }
  
  runCommand('npm run lint', 'Linting code');
}

function buildApp() {
  log('🏗️  Building application...', 'yellow');
  
  const isProduction = !process.argv.includes('--development');
  const buildCommand = isProduction ? 'npm run build' : 'npm run build -- --mode development';
  
  runCommand(buildCommand, `Building for ${isProduction ? 'production' : 'development'}`);
}

function analyzeBundle() {
  if (!process.argv.includes('--analyze')) {
    return;
  }
  
  log('📊 Analyzing bundle size...', 'yellow');
  runCommand('npm run build:analyze', 'Bundle analysis');
}

function verifyBuild() {
  log('🔍 Verifying build...', 'yellow');
  
  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    log('❌ index.html not found in dist', 'red');
    process.exit(1);
  }
  
  // Check for critical files
  const criticalFiles = [
    'index.html',
    'manifest.json',
    'sw.js'
  ];
  
  criticalFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      log(`✅ ${file} found`, 'green');
    } else {
      log(`⚠️  ${file} not found`, 'yellow');
    }
  });
  
  // Get build stats
  const stats = fs.statSync(distPath);
  log(`📦 Build size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`, 'blue');
}

function generateBuildInfo() {
  log('📝 Generating build info...', 'yellow');
  
  const packageJson = require('../package.json');
  const buildInfo = {
    version: packageJson.version,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    environment: process.argv.includes('--development') ? 'development' : 'production'
  };
  
  const buildInfoPath = path.join(process.cwd(), 'dist', 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  log(`✅ Build info written to ${buildInfoPath}`, 'green');
}

function main() {
  log('\n🚀 Me POS Build Script', 'bright');
  log('========================\n', 'bright');
  
  try {
    checkEnvironment();
    cleanBuild();
    runTests();
    lintCode();
    buildApp();
    analyzeBundle();
    verifyBuild();
    generateBuildInfo();
    
    log('\n🎉 Build completed successfully!', 'green');
    log('📁 Build output: ./dist', 'blue');
    
    if (!process.argv.includes('--development')) {
      log('\n🚀 Ready for deployment!', 'green');
      log('💡 Run "npm run deploy" to deploy to Firebase', 'blue');
    }
    
  } catch (error) {
    log(`\n💥 Build failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`\n💥 Uncaught error: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`\n💥 Unhandled rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run main function
main();
