#!/usr/bin/env node

// Deploy Script - Me POS by Mein Licht
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

function checkPrerequisites() {
  log('🔍 Checking deployment prerequisites...', 'yellow');
  
  // Check if Firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    log('✅ Firebase CLI found', 'green');
  } catch (error) {
    log('❌ Firebase CLI not found. Please install it with: npm install -g firebase-tools', 'red');
    process.exit(1);
  }
  
  // Check if user is logged in to Firebase
  try {
    execSync('firebase projects:list', { stdio: 'pipe' });
    log('✅ Firebase authentication verified', 'green');
  } catch (error) {
    log('❌ Not logged in to Firebase. Please run: firebase login', 'red');
    process.exit(1);
  }
  
  // Check if build exists
  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    log('❌ Build not found. Please run: npm run build', 'red');
    process.exit(1);
  }
  
  log('✅ Build found', 'green');
}

function checkFirebaseConfig() {
  log('🔍 Checking Firebase configuration...', 'yellow');
  
  const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
  const firebasercPath = path.join(process.cwd(), '.firebaserc');
  
  if (!fs.existsSync(firebaseJsonPath)) {
    log('❌ firebase.json not found', 'red');
    process.exit(1);
  }
  
  if (!fs.existsSync(firebasercPath)) {
    log('❌ .firebaserc not found', 'red');
    process.exit(1);
  }
  
  log('✅ Firebase configuration found', 'green');
  
  // Read and validate configuration
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
    const firebasercConfig = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
    
    if (!firebaseConfig.hosting) {
      log('❌ Hosting configuration not found in firebase.json', 'red');
      process.exit(1);
    }
    
    if (!firebasercConfig.projects || !firebasercConfig.projects.default) {
      log('❌ Default project not found in .firebaserc', 'red');
      process.exit(1);
    }
    
    const projectId = firebasercConfig.projects.default;
    log(`✅ Firebase project: ${projectId}`, 'green');
    
  } catch (error) {
    log(`❌ Invalid Firebase configuration: ${error.message}`, 'red');
    process.exit(1);
  }
}

function buildBeforeDeploy() {
  if (process.argv.includes('--skip-build')) {
    log('⏭️  Skipping build', 'yellow');
    return;
  }
  
  runCommand('node scripts/build.js', 'Building application');
}

function runTestsBeforeDeploy() {
  if (process.argv.includes('--skip-tests')) {
    log('⏭️  Skipping tests', 'yellow');
    return;
  }
  
  runCommand('npm test', 'Running tests');
}

function deployToFirebase() {
  const isPreview = process.argv.includes('--preview');
  const targetChannel = process.argv.includes('--preview') ? 'preview' : 'live';
  
  log(`🚀 Deploying to Firebase (${targetChannel})...`, 'yellow');
  
  let deployCommand = 'firebase deploy';
  
  if (isPreview) {
    deployCommand = 'firebase hosting:channel:deploy preview';
  }
  
  if (process.argv.includes('--debug')) {
    deployCommand += ' --debug';
  }
  
  if (process.argv.includes('--force')) {
    deployCommand += ' --force';
  }
  
  runCommand(deployCommand, `Deploying to ${targetChannel}`);
}

function verifyDeployment() {
  log('🔍 Verifying deployment...', 'yellow');
  
  const firebasercPath = path.join(process.cwd(), '.firebaserc');
  const firebasercConfig = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
  const projectId = firebasercConfig.projects.default;
  
  // Get project info
  try {
    const projectInfo = execSync(`firebase project:info ${projectId}`, { encoding: 'utf8' });
    log(`✅ Project verified: ${projectId}`, 'green');
    
    // Extract site URL if available
    const lines = projectInfo.split('\n');
    const siteUrlLine = lines.find(line => line.includes('Site URL'));
    if (siteUrlLine) {
      const url = siteUrlLine.split(':')[1].trim();
      log(`🌐 Site URL: ${url}`, 'blue');
    }
    
  } catch (error) {
    log('⚠️  Could not verify deployment', 'yellow');
  }
}

function generateDeploymentReport() {
  log('📝 Generating deployment report...', 'yellow');
  
  const packageJson = require('../package.json');
  const buildInfoPath = path.join(process.cwd(), 'dist', 'build-info.json');
  
  let buildInfo = {};
  if (fs.existsSync(buildInfoPath)) {
    buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
  }
  
  const deploymentReport = {
    ...buildInfo,
    deployment: {
      time: new Date().toISOString(),
      version: packageJson.version,
      environment: process.argv.includes('--preview') ? 'preview' : 'production',
      deployedBy: process.env.USER || 'unknown'
    }
  };
  
  const reportPath = path.join(process.cwd(), 'dist', 'deployment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(deploymentReport, null, 2));
  
  log(`✅ Deployment report written to ${reportPath}`, 'green');
}

function showPostDeploymentInfo() {
  log('\n🎉 Deployment completed successfully!', 'green');
  log('================================\n', 'bright');
  
  const firebasercPath = path.join(process.cwd(), '.firebaserc');
  const firebasercConfig = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
  const projectId = firebasercConfig.projects.default;
  
  log('📋 Deployment Information:', 'cyan');
  log(`   Project: ${projectId}`, 'blue');
  log(`   Environment: ${process.argv.includes('--preview') ? 'Preview' : 'Production'}`, 'blue');
  log(`   Version: ${require('../package.json').version}`, 'blue');
  
  log('\n🔗 Useful Links:', 'cyan');
  log(`   Firebase Console: https://console.firebase.google.com/project/${projectId}`, 'blue');
  log(`   Hosting: https://${projectId}.web.app`, 'blue');
  
  if (process.argv.includes('--preview')) {
    log('   Preview URL: Check Firebase console for preview link', 'blue');
  }
  
  log('\n💡 Next Steps:', 'cyan');
  if (process.argv.includes('--preview')) {
    log('   1. Test the preview deployment', 'yellow');
    log('   2. If satisfied, deploy to production with: npm run deploy', 'yellow');
  } else {
    log('   1. Test the live deployment', 'yellow');
    log('   2. Monitor performance and errors', 'yellow');
  }
  
  log('\n🛠️  Management Commands:', 'cyan');
  log('   View deployments: firebase deploy --list', 'blue');
  log('   Rollback: firebase deploy --list && firebase hosting:rollback', 'blue');
  log('   View logs: firebase functions:log', 'blue');
}

function main() {
  log('\n🚀 Me POS Deployment Script', 'bright');
  log('============================\n', 'bright');
  
  try {
    checkPrerequisites();
    checkFirebaseConfig();
    buildBeforeDeploy();
    runTestsBeforeDeploy();
    deployToFirebase();
    verifyDeployment();
    generateDeploymentReport();
    showPostDeploymentInfo();
    
  } catch (error) {
    log(`\n💥 Deployment failed: ${error.message}`, 'red');
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

// Parse command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('\n📖 Me POS Deployment Script Help', 'bright');
  log('===================================\n', 'bright');
  log('Usage: npm run deploy [options]\n', 'cyan');
  log('Options:', 'cyan');
  log('  --preview     Deploy to preview channel instead of production', 'blue');
  log('  --skip-build  Skip building before deployment', 'blue');
  log('  --skip-tests  Skip running tests before deployment', 'blue');
  log('  --debug       Enable debug logging', 'blue');
  log('  --force       Force deployment even if there are warnings', 'blue');
  log('  --help, -h    Show this help message\n', 'blue');
  log('Examples:', 'cyan');
  log('  npm run deploy              # Deploy to production', 'blue');
  log('  npm run deploy --preview    # Deploy to preview', 'blue');
  log('  npm run deploy --skip-build # Deploy without building', 'blue');
  process.exit(0);
}

// Run main function
main();
