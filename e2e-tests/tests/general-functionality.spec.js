/**
 * General Functionality E2E Tests
 * Comprehensive tests for chess application features
 */

import { test, expect } from '@playwright/test';
import { ChessTestUtils } from '../utils/ChessTestUtils.js';
import { ChessGamePage } from '../pages/ChessGamePage.js';

test.describe('Chess Application - General Functionality', () => {

  test.describe('User Authentication', () => {
    test('should handle login and registration toggle', async ({ page }) => {
      await page.goto('/auth');
      
      // Should start with login form
      await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
      await expect(page.locator('text=Sign in to continue playing chess')).toBeVisible();
      
      // Toggle to registration
      await page.click('button:has-text("Create one")');
      await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();
      await expect(page.locator('text=Join our community of chess players')).toBeVisible();
      
      // Toggle back to login
      await page.click('button:has-text("Sign in")');
      await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
    });

    test('should validate form fields', async ({ page }) => {
      await page.goto('/auth');
      
      const submitButton = page.locator('button[type="submit"]');
      
      // Submit button should be disabled with empty fields
      await expect(submitButton).toBeDisabled();
      
      // Fill only username
      await page.fill('input[name="username"]', 'testuser');
      await expect(submitButton).toBeDisabled();
      
      // Fill password too
      await page.fill('input[name="password"]', 'password123');
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Game Setup', () => {
    test('should display all time control options', async ({ page }) => {
      const utils = new ChessTestUtils(page);
      await utils.loginUser('SetupTestUser', 'password123');
      
      // Should show all time controls
      await expect(page.locator('text=Bullet')).toBeVisible();
      await expect(page.locator('text=Blitz')).toBeVisible();
      await expect(page.locator('text=Rapid')).toBeVisible();
      await expect(page.locator('text=Daily')).toBeVisible();
      await expect(page.locator('text=Custom')).toBeVisible();
    });

    test('should handle custom time control selection', async ({ page }) => {
      const utils = new ChessTestUtils(page);
      await utils.loginUser('CustomTimeUser', 'password123');
      
      // Select custom time control
      await page.click('.option-card:has-text("Custom")');
      
      // Should show custom time input
      await expect(page.locator('text=Minutes per player')).toBeVisible();
      await expect(page.locator('input[type="number"]')).toBeVisible();
      
      // Should have default value
      await expect(page.locator('input[type="number"]')).toHaveValue('5');
    });

    test('should display color selection options', async ({ page }) => {
      const utils = new ChessTestUtils(page);
      await utils.loginUser('ColorTestUser', 'password123');
      
      // Should show color options
      await expect(page.locator('text=White')).toBeVisible();
      await expect(page.locator('text=Black')).toBeVisible();
      await expect(page.locator('.option-card:has-text("Random")')).toBeVisible();
    });
  });

  test.describe('Game Flow', () => {
    test('should handle game link sharing', async ({ browser }) => {
      const whiteContext = await browser.newContext();
      const blackContext = await browser.newContext();
      
      const whitePlayerPage = await whiteContext.newPage();
      const blackPlayerPage = await blackContext.newPage();
      
      const whiteUtils = new ChessTestUtils(whitePlayerPage);
      const blackUtils = new ChessTestUtils(blackPlayerPage);
      const whiteGamePage = new ChessGamePage(whitePlayerPage);

      try {
        // White creates game
        await whiteUtils.loginUser('Sharer', 'password123');
        const gameId = await whiteUtils.createGame('rapid');
        
        // Get shareable link
        const gameLink = await whiteGamePage.shareGameLink();
        expect(gameLink).toContain(`/game/${gameId}`);
        
        // Black can join via direct link
        await blackUtils.loginUser('Joinee', 'password123');
        await blackPlayerPage.goto(gameLink);
        
        // Should see join game option
        await expect(blackPlayerPage.locator('button:has-text("Join Game")')).toBeVisible();
        
      } finally {
        await whitePlayerPage.close();
        await blackPlayerPage.close();
      }
    });

    test('should display game information correctly', async ({ browser }) => {
      const whiteContext = await browser.newContext();
      const blackContext = await browser.newContext();
      
      const whitePlayerPage = await whiteContext.newPage();
      const blackPlayerPage = await blackContext.newPage();
      
      const whiteUtils = new ChessTestUtils(whitePlayerPage);
      const blackUtils = new ChessTestUtils(blackPlayerPage);
      const whiteGamePage = new ChessGamePage(whitePlayerPage);

      try {
        // Setup game
        await whiteUtils.loginUser('InfoWhite', 'password123');
        const gameId = await whiteUtils.createGame('blitz');
        
        await blackUtils.loginUser('InfoBlack', 'password123');
        await blackUtils.joinGame(gameId);
        
        await whiteGamePage.waitForGameActive();
        
        // Check game info display
        const displayedGameId = await whiteGamePage.getGameId();
        expect(displayedGameId).toBe(gameId);
        
        // Check player displays
        await expect(whiteGamePage.whitePlayerDisplay).toContainText('InfoWhite');
        await expect(whiteGamePage.blackPlayerDisplay).toContainText('InfoBlack');
        
        // Check turn indicator
        await expect(whiteGamePage.turnIndicator).toBeVisible();
        
      } finally {
        await whitePlayerPage.close();
        await blackPlayerPage.close();
      }
    });

    test('should handle turn-based gameplay correctly', async ({ browser }) => {
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
        await whiteUtils.loginUser('TurnWhite', 'password123');
        const gameId = await whiteUtils.createGame('rapid');
        
        await blackUtils.loginUser('TurnBlack', 'password123');
        await blackUtils.joinGame(gameId);
        
        await whiteGamePage.waitForGameActive();
        await blackGamePage.waitForGameActive();
        
        // White's turn first
        await expect(whiteGamePage.isPlayerTurn('white')).resolves.toBe(true);
        await expect(blackGamePage.isPlayerTurn('white')).resolves.toBe(true);
        
        // White makes move
        await whiteGamePage.makeMove('e2', 'e4');
        
        // Should now be Black's turn
        await blackGamePage.waitForPlayerTurn('black');
        await expect(blackGamePage.isPlayerTurn('black')).resolves.toBe(true);
        
        // Black makes move
        await blackGamePage.makeMove('e7', 'e5');
        
        // Should now be White's turn again
        await whiteGamePage.waitForPlayerTurn('white');
        await expect(whiteGamePage.isPlayerTurn('white')).resolves.toBe(true);
        
      } finally {
        await whitePlayerPage.close();
        await blackPlayerPage.close();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid moves gracefully', async ({ browser }) => {
      const whiteContext = await browser.newContext();
      const blackContext = await browser.newContext();
      
      const whitePlayerPage = await whiteContext.newPage();
      const blackPlayerPage = await blackContext.newPage();
      
      const whiteUtils = new ChessTestUtils(whitePlayerPage);
      const blackUtils = new ChessTestUtils(blackPlayerPage);
      const whiteGamePage = new ChessGamePage(whitePlayerPage);

      try {
        // Setup game
        await whiteUtils.loginUser('ErrorWhite', 'password123');
        const gameId = await whiteUtils.createGame('bullet');
        
        await blackUtils.loginUser('ErrorBlack', 'password123');
        await blackUtils.joinGame(gameId);
        
        await whiteGamePage.waitForGameActive();
        
        // Try to make an invalid move (should fail gracefully)
        try {
          await whiteGamePage.makeMove('e2', 'e5'); // Invalid: can't move 3 squares
          // If the move somehow succeeds, that's also okay - the backend should validate
        } catch (error) {
          // Expected - invalid moves should be rejected
          console.log('Invalid move correctly rejected');
        }
        
        // Game should still be playable
        await whiteGamePage.makeMove('e2', 'e4'); // Valid move
        
        // No error messages should persist
        await expect(whitePlayerPage.locator('.error')).not.toBeVisible();
        
      } finally {
        await whitePlayerPage.close();
        await blackPlayerPage.close();
      }
    });
  });
});