import { test, expect, type Page } from '@playwright/test';

// Test data: Issue #78 case - line break position difference
const ORIGINAL_LONG_LINE = `When these situations occur, Amazon EC2 Auto Scaling chooses the policy that provides the largest capacity for both scale out and scale in. Suppose, for example, that the policy for CPUUtilization launches one instance, while the policy for the SQS queue launches two instances. If the scale-out criteria for both policies are met at the same time, Amazon EC2
   Auto Scaling gives precedence to the SQS queue policy. This results in the Auto Scaling group launching two instances.`;

const MODIFIED_LONG_LINE = `When these situations occur, Amazon EC2 Auto Scaling chooses the policy that provides the largest capacity for both scale out and scale in. Suppose, for example, that the policy for CPUUtilization launches one instance, while the policy for the SQS queue launches two instances. If the scale-out criteria for both policies are met at the same time, Amazon EC2 Auto Scaling gives precedence to the SQS queue policy. This results in the Auto Scaling group launching two instances.`;

// Test data: simple diff
const ORIGINAL_SIMPLE = `line 1
line 2
line 3
line 4
line 5`;

const MODIFIED_SIMPLE = `line 1
line 2 modified
line 3
new line
line 4
line 5`;

async function inputTextAndCompare(
  page: Page,
  original: string,
  modified: string
) {
  // Wait for page to load
  await page.waitForSelector('textarea');
  const textareas = page.locator('textarea');

  // Input original text
  await textareas.nth(0).fill(original);
  // Input modified text
  await textareas.nth(1).fill(modified);

  // Click compare button
  const compareButton = page.locator('button').filter({ hasText: /比較|Compare|Comparer|Vergleichen|비교|Bandingkan|比較檔案|比较/ });
  await compareButton.click();

  // Wait for results to appear
  await page.waitForSelector('[role="main"]', { timeout: 10000 });
  // Small delay for rendering
  await page.waitForTimeout(500);
}

test.describe('Visual Regression - Side-by-side view', () => {
  test('long line with line break difference', async ({ page }) => {
    await page.goto('/ja/');
    await inputTextAndCompare(page, ORIGINAL_LONG_LINE, MODIFIED_LONG_LINE);
    await expect(page).toHaveScreenshot('side-by-side-long-line.png', {
      fullPage: true,
    });
  });

  test('simple diff', async ({ page }) => {
    await page.goto('/ja/');
    await inputTextAndCompare(page, ORIGINAL_SIMPLE, MODIFIED_SIMPLE);
    await expect(page).toHaveScreenshot('side-by-side-simple-diff.png', {
      fullPage: true,
    });
  });
});

test.describe('Visual Regression - Unified view', () => {
  test('long line with line break difference', async ({ page }) => {
    await page.goto('/ja/');
    await inputTextAndCompare(page, ORIGINAL_LONG_LINE, MODIFIED_LONG_LINE);

    // Switch to unified view (icon button with aria-label)
    const unifiedButton = page.locator('button[aria-label*="統合"], button[aria-label*="Unified"], button[aria-label*="unifi"]');
    await unifiedButton.click();
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('unified-long-line.png', {
      fullPage: true,
    });
  });

  test('simple diff', async ({ page }) => {
    await page.goto('/ja/');
    await inputTextAndCompare(page, ORIGINAL_SIMPLE, MODIFIED_SIMPLE);

    // Switch to unified view (icon button with aria-label)
    const unifiedButton = page.locator('button[aria-label*="統合"], button[aria-label*="Unified"], button[aria-label*="unifi"]');
    await unifiedButton.click();
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('unified-simple-diff.png', {
      fullPage: true,
    });
  });
});

test.describe('Visual Regression - Empty and initial states', () => {
  test('initial page load', async ({ page }) => {
    await page.goto('/ja/');
    await page.waitForSelector('textarea');
    await expect(page).toHaveScreenshot('initial-state.png', {
      fullPage: true,
    });
  });
});
