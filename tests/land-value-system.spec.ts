import { test, expect } from '@playwright/test';

test.describe('Land Value System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('REQ-LAND-001: Each tile should display its land value (0-10 scale)', async ({ page }) => {
    // Check that empty tiles show land value numbers
    const firstTile = page.locator('.grid-cell').first();
    const landValueText = await firstTile.locator('.land-value').textContent();
    
    expect(landValueText).toBeTruthy();
    const value = parseInt(landValueText);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(10);
  });

  test('REQ-LAND-002: Empty tiles should show numeric value with colored background', async ({ page }) => {
    const emptyTile = page.locator('.grid-cell:not(:has(.building))').first();
    
    // Check for numeric display
    await expect(emptyTile.locator('.land-value')).toBeVisible();
    
    // Check for colored background based on value
    const landValueElement = emptyTile.locator('.land-value');
    const value = parseInt(await landValueElement.textContent() || '0');
    
    // Verify color class exists
    const hasColorClass = await landValueElement.evaluate((el, val) => {
      return el.classList.contains(`land-value-${val}`);
    }, value);
    
    expect(hasColorClass).toBe(true);
  });

  test('REQ-LAND-003: Occupied tiles should show colored border indicating land value', async ({ page }) => {
    // Wait for game to initialize
    await page.waitForFunction(() => (window as any).gameState !== undefined);
    
    // First place a building
    await page.locator('[data-building="residential"]').click();
    const targetTile = page.locator('.grid-cell').nth(50); // Middle of grid
    await targetTile.click();
    
    // Check that the occupied tile has a land value overlay
    await expect(targetTile.locator('.land-value-overlay')).toBeVisible();
    
    // Also check for colored border
    const hasBorderClass = await targetTile.evaluate((el) => {
      const classList = Array.from(el.classList);
      return classList.some(cls => cls.startsWith('land-value-border-'));
    });
    
    expect(hasBorderClass).toBe(true);
  });

  test('REQ-LAND-004: Land value should update in real-time after building placement', async ({ page }) => {
    // Get initial land value of a tile
    const targetTile = page.locator('.grid-cell').nth(50);
    const adjacentTile = page.locator('.grid-cell').nth(51);
    
    const initialValue = parseInt(await adjacentTile.locator('.land-value').textContent() || '0');
    
    // Place a commercial building (should increase adjacent land value by +2)
    await page.locator('[data-building="commercial"]').click();
    await targetTile.click();
    
    // Wait for value update
    await page.waitForTimeout(100); // Allow for any animations
    
    const newValue = parseInt(await adjacentTile.locator('.land-value').textContent() || '0');
    expect(newValue).toBe(initialValue + 2);
  });

  test('REQ-LAND-005: Land values are always visible', async ({ page }) => {
    // Land values should always be visible now
    await expect(page.locator('.land-value').first()).toBeVisible();
    
    // Press V should not affect visibility
    await page.keyboard.press('v');
    await expect(page.locator('.land-value').first()).toBeVisible();
  });

  test('REQ-LAND-006: Commercial buildings should increase adjacent land value by +2', async ({ page }) => {
    const centerTile = page.locator('.grid-cell').nth(50);
    const rightTile = page.locator('.grid-cell').nth(51);
    const leftTile = page.locator('.grid-cell').nth(49);
    const topTile = page.locator('.grid-cell').nth(30); // Assuming 20 columns
    const bottomTile = page.locator('.grid-cell').nth(70);
    
    // Get initial values
    const getValues = async () => ({
      right: parseInt(await rightTile.locator('.land-value').textContent() || '0'),
      left: parseInt(await leftTile.locator('.land-value').textContent() || '0'),
      top: parseInt(await topTile.locator('.land-value').textContent() || '0'),
      bottom: parseInt(await bottomTile.locator('.land-value').textContent() || '0')
    });
    
    const initialValues = await getValues();
    
    // Place commercial building
    await page.locator('[data-building="commercial"]').click();
    await centerTile.click();
    
    await page.waitForTimeout(100);
    const newValues = await getValues();
    
    // All adjacent tiles should increase by 2
    expect(newValues.right).toBe(initialValues.right + 2);
    expect(newValues.left).toBe(initialValues.left + 2);
    expect(newValues.top).toBe(initialValues.top + 2);
    expect(newValues.bottom).toBe(initialValues.bottom + 2);
  });

  test('REQ-LAND-007: Industrial buildings should decrease adjacent land value by -1', async ({ page }) => {
    const centerTile = page.locator('.grid-cell').nth(50);
    const adjacentTile = page.locator('.grid-cell').nth(51);
    
    const initialValue = parseInt(await adjacentTile.locator('.land-value').textContent() || '0');
    
    // Place industrial building
    await page.locator('[data-building="industrial"]').click();
    await centerTile.click();
    
    await page.waitForTimeout(100);
    const newValue = parseInt(await adjacentTile.locator('.land-value').textContent() || '0');
    
    expect(newValue).toBe(initialValue - 1);
  });

  test('REQ-LAND-008: Power plants should decrease land value by -2 in 2-tile radius', async ({ page }) => {
    const centerTile = page.locator('.grid-cell').nth(50);
    const oneTileAway = page.locator('.grid-cell').nth(51);
    const twoTilesAway = page.locator('.grid-cell').nth(52);
    const threeTilesAway = page.locator('.grid-cell').nth(53);
    
    // Get initial values
    const initialOne = parseInt(await oneTileAway.locator('.land-value').textContent() || '0');
    const initialTwo = parseInt(await twoTilesAway.locator('.land-value').textContent() || '0');
    const initialThree = parseInt(await threeTilesAway.locator('.land-value').textContent() || '0');
    
    // Place power plant
    await page.locator('[data-building="power"]').click();
    await centerTile.click();
    
    await page.waitForTimeout(100);
    
    // Check new values
    const newOne = parseInt(await oneTileAway.locator('.land-value').textContent() || '0');
    const newTwo = parseInt(await twoTilesAway.locator('.land-value').textContent() || '0');
    const newThree = parseInt(await threeTilesAway.locator('.land-value').textContent() || '0');
    
    // Within 2-tile radius should decrease by 2
    expect(newOne).toBe(initialOne - 2);
    expect(newTwo).toBe(initialTwo - 2);
    // Outside radius should not change
    expect(newThree).toBe(initialThree);
  });

  test('REQ-LAND-009: Building costs should increase based on land value', async ({ page }) => {
    // Wait for game to initialize
    await page.waitForFunction(() => (window as any).gameState !== undefined);
    
    // First increase land value by placing a commercial building
    await page.locator('[data-building="commercial"]').click();
    await page.locator('.grid-cell').nth(50).click();
    
    // Now try to build on high-value adjacent tile
    const highValueTile = page.locator('.grid-cell').nth(51);
    await page.locator('[data-building="residential"]').click();
    
    // Hover over high value tile to see cost
    await highValueTile.hover();
    
    // Get the displayed cost from info panel
    const costText = await page.locator('#tile-info').textContent();
    const costMatch = costText?.match(/Cost: \$(\d+)/);
    const adjustedCost = costMatch ? parseInt(costMatch[1]) : 0;
    
    // Residential base cost is $500, should be higher on high-value land
    expect(adjustedCost).toBeGreaterThan(500);
  });

  test('REQ-LAND-010: Land values should be clamped between 0 and 10', async ({ page }) => {
    // Place multiple industrial buildings to try to drive value below 0
    const positions = [30, 31, 32, 50, 52, 70, 71, 72]; // Surrounding positions
    
    for (const pos of positions) {
      await page.locator('[data-building="industrial"]').click();
      await page.locator('.grid-cell').nth(pos).click();
    }
    
    // Check center tile value
    const centerValue = parseInt(await page.locator('.grid-cell').nth(51).locator('.land-value').textContent() || '0');
    expect(centerValue).toBeGreaterThanOrEqual(0);
    expect(centerValue).toBeLessThanOrEqual(10);
  });
});