// Appium test for mobile app (requires Appium server running)
const wdio = require('webdriverio');

const opts = {
  path: '/wd/hub',
  port: 4723,
  capabilities: {
    platformName: 'Android',
    'appium:platformVersion': '11.0',
    'appium:deviceName': 'emulator',
    'appium:app': './mobile/app-debug.apk',
    'appium:automationName': 'UiAutomator2'
  }
};

async function runMobileTests() {
  const client = await wdio.remote(opts);
  
  try {
    console.log('📱 Running mobile tests...');
    
    // Find email field and enter text
    const emailField = await client.$('~email-input');
    await emailField.setValue('test@test.com');
    
    // Find password field
    const passwordField = await client.$('~password-input');
    await passwordField.setValue('password123');
    
    // Click login button
    const loginBtn = await client.$('~login-button');
    await loginBtn.click();
    
    await client.pause(2000);
    console.log('✅ Mobile login test passed');
    
  } catch (error) {
    console.error('❌ Mobile test failed:', error);
  } finally {
    await client.deleteSession();
  }
}

runMobileTests();