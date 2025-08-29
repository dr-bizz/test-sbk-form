# Weekly Form Ping

Zero-cost automated weekly form monitoring using Playwright and GitHub Actions. Submits a test form every Monday and verifies success.

## Quick Setup

### 1. Repository Setup
1. Create a new GitHub repository
2. Add all files from this project
3. Enable GitHub Actions (Settings → Actions → General → Allow all actions)

### 2. Configure Secrets
Go to **Settings → Secrets and variables → Actions** and add:

**Required:**
- `FORM_URL` - Your contact form URL (e.g., `https://example.com/contact?monitor=1`)

**Optional (uses intelligent defaults if not provided):**
- `NAME_SELECTOR` - CSS selector for name field
- `EMAIL_SELECTOR` - CSS selector for email field  
- `MESSAGE_SELECTOR` - CSS selector for message field
- `SUBMIT_SELECTOR` - CSS selector for submit button
- `SUCCESS_REGEX` - Regex pattern for success message

### 3. Test the Setup
1. Go to **Actions** tab
2. Click "Weekly Form Ping" workflow
3. Click "Run workflow" → "Run workflow"
4. Monitor the run to ensure it works correctly

## Default Selectors

The test uses smart fallbacks for common WordPress/contact form patterns:

```typescript
// Name field
input[name="your-name"], input[name="name"], #name, input[id*="name"]

// Email field  
input[name="your-email"], input[name="email"], #email, input[id*="email"]

// Message field
textarea[name="your-message"], textarea[name="message"], #message, textarea[id*="message"]

// Submit button
button[type="submit"], input[type="submit"], .submit, #submit

// Success message (case-insensitive)
thank you|message has been sent|we'll be in touch|successfully sent|form submitted
```

## Schedule

- **Current:** Mondays at 14:00 UTC (10am ET during DST, 9am ET during Standard Time)
- **To change:** Edit the `cron` line in `.github/workflows/weekly.yml`

### Common Schedule Examples:
```yaml
# Every Monday 9am ET year-round (13:00 UTC)
- cron: '0 13 * * 1'

# Every Monday 10am ET year-round (14:00 UTC) - current setting
- cron: '0 14 * * 1'  

# Every Sunday 8am ET year-round (12:00 UTC)
- cron: '0 12 * * 0'
```

## Local Development

### Run Tests Locally
```bash
npm install
npx playwright install --with-deps
export FORM_URL="https://your-site.com/contact?monitor=1"
npx playwright test
```

### View Results
- Screenshots and HTML: `test-results/` directory
- HTML report: `npx playwright show-report`

### Debug Mode
```bash
npx playwright test --debug
```

## Handling CAPTCHAs and Anti-Bot Protection

### Recommended Approach: Monitor Query Parameter
Add `?monitor=1` (or similar) to your form URL and configure your site to:

1. **Skip CAPTCHA** when this parameter is present
2. **Add hidden field** `<input type="hidden" name="test_reason" value="">` 
3. **Filter these submissions** in your admin/notifications

### Implementation Examples:

**WordPress Contact Form 7:**
```php
// In functions.php
add_filter('wpcf7_verify_nonce', function($result) {
    if (isset($_GET['monitor']) && $_GET['monitor'] === '1') {
        return true; // Skip nonce verification
    }
    return $result;
});
```

**Generic PHP:**
```php
if (isset($_GET['monitor']) && $_GET['monitor'] === '1') {
    // Skip CAPTCHA verification
    $skip_captcha = true;
}
```

**WordPress (disable reCAPTCHA for monitors):**
```php
add_filter('google_captcha_check', function($result) {
    if (isset($_GET['monitor'])) {
        return true; // Skip CAPTCHA
    }
    return $result;
});
```

### Alternative: User-Agent Detection
Some plugins allow whitelisting specific user-agents. The test runs with Playwright's Chrome user-agent.

## Troubleshooting

### Common Issues

**❌ Selectors not found**
- Check your form's HTML source
- Update selectors in repository secrets
- Use browser dev tools to find correct selectors

**❌ Success message not detected**
- Check the actual success text on your form
- Update `SUCCESS_REGEX` secret with the exact text
- Make sure the success message appears in the DOM (not just an alert)

**❌ CAPTCHA blocking**
- Implement the `?monitor=1` bypass approach above
- Never try to solve CAPTCHAs automatically

### Viewing Failure Details
1. Go to failed Action run
2. Download "test-results" artifacts
3. Open `failure-screenshot.png` and `failure-page.html`

### Testing Changes
Always test changes locally first:
```bash
export FORM_URL="your-url-here"
npx playwright test --headed
```

## Security Notes

- Secrets are never logged or exposed
- Uses neutral email: `weekly-test@example.com`
- Test messages clearly identify as monitoring
- No sensitive data is transmitted

## Cost
- **$0** - Uses only GitHub's free tier (2,000 action minutes/month)
- Each run takes ~2-3 minutes
- Weekly runs = ~12 minutes/month total