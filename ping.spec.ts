import { test, expect } from '@playwright/test';

test('Weekly form ping', async ({ page }) => {
  // Environment variables with fallbacks
  const FORM_URL = process.env.FORM_URL || 'https://example.com/contact?monitor=1';
  const NAME_SELECTOR = process.env.NAME_SELECTOR || 'input[name="your-name"], input[name="name"], #name, input[id*="name"]';
  const EMAIL_SELECTOR = process.env.EMAIL_SELECTOR || 'input[name="your-email"], input[name="email"], #email, input[id*="email"]';
  const MESSAGE_SELECTOR = process.env.MESSAGE_SELECTOR || 'textarea[name="your-message"], textarea[name="message"], #message, textarea[id*="message"]';
  const SUBMIT_SELECTOR = process.env.SUBMIT_SELECTOR || 'button[type="submit"], input[type="submit"], .submit, #submit';
  const SUCCESS_REGEX = process.env.SUCCESS_REGEX || 'thank you|message has been sent|we\'ll be in touch|successfully sent|form submitted';

  console.log('Starting weekly form ping...');
  console.log('Form URL:', FORM_URL.replace(/([?&].*)/g, '?[hidden]')); // Hide query params from logs

  try {
    // Navigate to the form
    await page.goto(FORM_URL, { waitUntil: 'domcontentloaded' });
    console.log('Page loaded successfully');

    // Wait for form to be ready
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Fill the name field
    const nameField = page.locator(NAME_SELECTOR).first();
    await expect(nameField).toBeVisible({ timeout: 10000 });
    await nameField.fill('Weekly Monitor Test');
    console.log('Name field filled');

    // Fill the email field
    const emailField = page.locator(EMAIL_SELECTOR).first();
    await expect(emailField).toBeVisible({ timeout: 10000 });
    await emailField.fill('weekly-test@example.com');
    console.log('Email field filled');

    // Fill the message field
    const messageField = page.locator(MESSAGE_SELECTOR).first();
    await expect(messageField).toBeVisible({ timeout: 10000 });
    await messageField.fill('This is an automated weekly monitoring test. Please ignore this message.');
    console.log('Message field filled');

    // Add hidden test identifier if possible
    try {
      const hiddenField = page.locator('input[name="test_reason"]');
      if (await hiddenField.isVisible({ timeout: 1000 })) {
        await hiddenField.fill('weekly_monitor');
        console.log('Test identifier field filled');
      }
    } catch (e) {
      // Hidden field doesn't exist, that's fine
    }

    // Take a screenshot before submission for debugging
    await page.screenshot({ 
      path: 'test-results/before-submit.png', 
      fullPage: true 
    });

    // Submit the form
    const submitButton = page.locator(SUBMIT_SELECTOR).first();
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click();
    console.log('Form submitted');

    // Wait for response and check for success message
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Create regex from SUCCESS_REGEX string (case insensitive)
    const successRegex = new RegExp(SUCCESS_REGEX, 'i');
    const successElement = page.locator(`text=${successRegex}`);
    
    await expect(successElement).toBeVisible({ 
      timeout: 15000,
      message: `Success message not found. Expected to match: ${SUCCESS_REGEX}`
    });
    
    console.log('✅ Form submission successful - success message found');
    
    // Take success screenshot
    await page.screenshot({ 
      path: 'test-results/success.png', 
      fullPage: true 
    });

  } catch (error) {
    console.error('❌ Form ping failed:', error.message);
    
    // Save artifacts for debugging
    await page.screenshot({ 
      path: 'test-results/failure-screenshot.png', 
      fullPage: true 
    });
    
    const html = await page.content();
    require('fs').writeFileSync('test-results/failure-page.html', html);
    
    // Re-throw to fail the test
    throw error;
  }
});