/**
 * Smoke Tests for Chess Application
 * Basic functionality and user flow validation
 */

import { test, expect } from '@playwright/test';
import { ChessTestUtils } from '../utils/ChessTestUtils.js';
import { ChessGamePage } from '../pages/ChessGamePage.js';

test.describe('Chess Application - Smoke Tests', () => {
  
  test('Landing page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Chess/i);
    
    // Should have some main content
    await expect(page.locator('h1.title')).toBeVisible();
  });

  test('Authentication flow works', async ({ page }) => {
    const utils = new ChessTestUtils(page);
    
    // Login should work
    await utils.loginUser('SmokeTestUser', 'password123');
    
    // Should be redirected to setup page
    await expect(page.locator('text=Setup New Game')).toBeVisible();
    await expect(page.locator('text=Welcome back, SmokeTestUser!')).toBeVisible();
  });

  test('Game creation works', async ({ page }) => {
    const utils = new ChessTestUtils(page);
    const gamePage = new ChessGamePage(page);
    
    // Login and create game
    await utils.loginUser('GameCreator', 'password123');
    const gameId = await utils.createGame('rapid');
    
    // Should be on game page
    await expect(page.locator('text=Chess Game')).toBeVisible();
    await expect(page.locator('h3:has-text("Waiting for opponent")')).toBeVisible();
    
    // Game ID should be displayed
    const displayedGameId = await gamePage.getGameId();
    expect(displayedGameId).toBe(gameId);
  });

  test('Two-player game setup works', async ({ browser }) => {
    const whiteContext = await browser.newContext();
    const blackContext = await browser.newContext();
    
    const whitePlayerPage = await whiteContext.newPage();
    const blackPlayerPage = await blackContext.newPage();
    
    const whiteUtils = new ChessTestUtils(whitePlayerPage);
    const blackUtils = new ChessTestUtils(blackPlayerPage);
    const whiteGamePage = new ChessGamePage(whitePlayerPage);
    const blackGamePage = new ChessGamePage(blackPlayerPage);

    try {
      // White creates game
      await whiteUtils.loginUser('Player1', 'password123');
      const gameId = await whiteUtils.createGame('blitz');
      
      // Black joins game
      await blackUtils.loginUser('Player2', 'password123');
      await blackUtils.joinGame(gameId, 'Player2', 'password123');
      
      // Both should see active game
      await whiteGamePage.waitForGameActive();
      await blackGamePage.waitForGameActive();
      
      // Verify players are displayed
      await expect(whiteGamePage.whitePlayerDisplay).toContainText('Player1');
      await expect(whiteGamePage.blackPlayerDisplay).toContainText('Player2');
      await expect(blackGamePage.whitePlayerDisplay).toContainText('Player1');
      await expect(blackGamePage.blackPlayerDisplay).toContainText('Player2');
      
      console.log('✅ Two-player setup smoke test passed');
      
    } finally {
      await whitePlayerPage.close();
      await blackPlayerPage.close();
    }
  });

  test('Basic move interaction works', async ({ browser }) => {
    const whiteContext = await browser.newContext();
    const blackContext = await browser.newContext();
    
    const whitePlayerPage = await whiteContext.newPage();
    const blackPlayerPage = await blackContext.newPage();
    
    const whiteUtils = new ChessTestUtils(whitePlayerPage);
    const blackUtils = new ChessTestUtils(blackPlayerPage);
    const whiteGamePage = new ChessGamePage(whitePlayerPage);
    const blackGamePage = new ChessGamePage(blackPlayerPage);

    try {
      // Setup game
      await whiteUtils.loginUser('MoveTest1', 'password123');
      const gameId = await whiteUtils.createGame('blitz');
      
      await blackUtils.loginUser('MoveTest2', 'password123');
      await blackUtils.joinGame(gameId, 'MoveTest2', 'password123');
      
      await whiteGamePage.waitForGameActive();
      await blackGamePage.waitForGameActive();
      
      // Test basic moves
      await whiteGamePage.makeMove('e2', 'e4');
      console.log('✓ White made opening move: e2-e4');
      
      await blackGamePage.makeMove('e7', 'e5');
      console.log('✓ Black responded: e7-e5');
      
      // Both moves should be successful (no error messages)
      await expect(whitePlayerPage.locator('.error')).not.toBeVisible();
      await expect(blackPlayerPage.locator('.error')).not.toBeVisible();
      
      console.log('✅ Basic move interaction smoke test passed');
      
    } finally {
      await whitePlayerPage.close();
      await blackPlayerPage.close();
    }
  });
});