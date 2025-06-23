/**
 * Chess Test Utilities for Playwright E2E Tests
 * Provides helper methods for simulating user interactions in chess games
 */

import { expect } from '@playwright/test';

export class ChessTestUtils {
  constructor(page) {
    this.page = page;
  }

  /**
   * Login a user with given credentials
   */
  async loginUser(username, password) {
    // Navigate to auth page
    await this.page.goto('/auth');
    
    // Fill login form
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    
    // Wait for the submit button to be enabled
    await this.page.waitForSelector('button[type="submit"]:not([disabled])');
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for navigation to setup page
    await this.page.waitForURL('/setup');
  }

  /**
   * Create a new game and return the game ID
   */
  async createGame(timeControl = 'blitz') {
    // Navigate to setup page
    await this.page.goto('/setup');
    
    // Select time control if not default
    if (timeControl !== 'blitz') {
      await this.page.click(`.option-card:has-text("${timeControl}")`);
    }
    
    // Click create game button
    await this.page.click('button:has-text("Create Game")');
    
    // Wait for navigation to game page and extract game ID from URL
    await this.page.waitForURL(/\/game\/(.+)/);
    const url = this.page.url();
    const gameId = url.split('/game/')[1];
    
    return gameId;
  }

  /**
   * Join an existing game by game ID
   * Handles authentication flow if needed
   */
  async joinGame(gameId, username = null, password = null) {
    await this.page.goto(`/game/${gameId}`);
    
    // Wait for the page to load completely
    await this.page.waitForLoadState('networkidle');
    
    // Check if redirected to auth page and handle authentication if credentials provided
    if (this.page.url().includes('/auth')) {
      if (username && password) {
        console.log(`Player ${username} needs to authenticate for game ${gameId}`);
        await this.page.fill('input[name="username"]', username);
        await this.page.fill('input[name="password"]', password);
        await this.page.click('button[type="submit"]');
        await this.page.waitForURL(`/game/${gameId}`, { timeout: 10000 });
      } else {
        throw new Error('User needs to be logged in before joining game. Call loginUser() first or provide username/password to joinGame().');
      }
    }
    
    // Wait a bit for client-side routing and check for auth form (in case of client-side redirect)
    await this.page.waitForTimeout(2000);
    const hasAuthForm = await this.page.locator('input[name="username"]').count();
    if (hasAuthForm > 0) {
      if (username && password) {
        console.log(`Player ${username} needs to authenticate (client-side redirect)`);
        await this.page.fill('input[name="username"]', username);
        await this.page.fill('input[name="password"]', password);
        await this.page.click('button[type="submit"]');
        await this.page.waitForTimeout(3000); // Wait for redirect back to game
      } else {
        throw new Error('User authentication required. Please call loginUser() before joinGame() or provide credentials.');
      }
    }
    
    // Look for and click the join game button
    const joinButton = this.page.locator('button:has-text("Join Game")');
    try {
      await joinButton.waitFor({ timeout: 5000 });
      await joinButton.click();
      console.log('Successfully clicked Join Game button');
    } catch (error) {
      console.log('Join Game button not found or not clickable, checking if already joined');
      // Maybe the user is already in the game
    }
    
    // Wait for game to become active (chessboard should appear)
    await this.page.waitForSelector('[data-testid="chessboard"], .chessboard-container', { timeout: 15000 });
  }

  /**
   * Make a chess move by clicking source and target squares
   * Uses data-square attributes for reliable square selection
   */
  async makeMove(fromSquare, toSquare) {
    // Wait for chessboard to be ready
    await this.page.waitForSelector('[data-testid="chessboard"], .chessboard-container');
    
    // Look for squares using various possible selectors
    const fromSelector = `[data-square="${fromSquare}"], [data-testid="${fromSquare}"], [class*="${fromSquare}"]`;
    const toSelector = `[data-square="${toSquare}"], [data-testid="${toSquare}"], [class*="${toSquare}"]`;
    
    try {
      // Method 1: Try direct data-square attributes
      const fromElement = this.page.locator(`[data-square="${fromSquare}"]`).first();
      const toElement = this.page.locator(`[data-square="${toSquare}"]`).first();
      
      if (await fromElement.isVisible() && await toElement.isVisible()) {
        await fromElement.click();
        await toElement.click();
        return;
      }
    } catch (e) {
      console.log('Method 1 failed, trying alternative approach...');
    }
    
    try {
      // Method 2: Try using drag and drop simulation
      await this.page.dragAndDrop(fromSelector, toSelector);
      return;
    } catch (e) {
      console.log('Method 2 failed, trying coordinate-based approach...');
    }
    
    try {
      // Method 3: Use coordinate-based approach
      await this.makeMoveByCoordinates(fromSquare, toSquare);
    } catch (e) {
      throw new Error(`Failed to make move ${fromSquare} to ${toSquare}: ${e.message}`);
    }
  }

  /**
   * Make move using coordinate calculations (fallback method)
   */
  async makeMoveByCoordinates(fromSquare, toSquare) {
    const chessboard = this.page.locator('.chessboard-container, [data-testid="chessboard"]').first();
    await chessboard.waitFor();
    
    const boardBox = await chessboard.boundingBox();
    const squareSize = boardBox.width / 8;
    
    const getSquareCoordinates = (square) => {
      const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
      const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc. (flipped for UI)
      
      return {
        x: boardBox.x + file * squareSize + squareSize / 2,
        y: boardBox.y + rank * squareSize + squareSize / 2
      };
    };
    
    const fromCoords = getSquareCoordinates(fromSquare);
    const toCoords = getSquareCoordinates(toSquare);
    
    // Simulate drag and drop
    await this.page.mouse.move(fromCoords.x, fromCoords.y);
    await this.page.mouse.down();
    await this.page.mouse.move(toCoords.x, toCoords.y);
    await this.page.mouse.up();
  }

  /**
   * Wait for turn indicator to show it's a specific player's turn
   */
  async waitForPlayerTurn(color) {
    const turnIndicator = color === 'white' ? 'White to move' : 'Black to move';
    await this.page.waitForSelector(`text=${turnIndicator}`, { timeout: 5000 });
  }

  /**
   * Wait for game to end and verify the winner
   */
  async waitForGameEnd(expectedWinner) {
    // Wait for game over status
    await this.page.waitForSelector('text=/.*wins!|.*draw/', { timeout: 10000 });
    
    // Verify the winner
    if (expectedWinner === 'white') {
      await expect(this.page.locator('text=/White wins!|.*White.*wins/')).toBeVisible();
    } else if (expectedWinner === 'black') {
      await expect(this.page.locator('text=/Black wins!|.*Black.*wins/')).toBeVisible();
    } else if (expectedWinner === 'draw') {
      await expect(this.page.locator('text=draw')).toBeVisible();
    }
  }

  /**
   * Verify current FEN position (optional utility)
   */
  async verifyFEN(expectedFEN) {
    // This would require the FEN to be exposed in the UI or via a test attribute
    // For now, we'll rely on move sequence verification
    console.log(`Expected FEN: ${expectedFEN}`);
  }

  /**
   * Wait for both players to be connected
   */
  async waitForBothPlayers() {
    // Wait for both player names to be visible (not "Waiting for player...")
    await this.page.waitForSelector('text=⚪', { timeout: 10000 });
    await this.page.waitForSelector('text=⚫', { timeout: 10000 });
    
    // Ensure we don't see "Waiting for player..." text
    await expect(this.page.locator('text=Waiting for player')).not.toBeVisible();
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  /**
   * Log current game state for debugging
   */
  async logGameState() {
    const status = await this.page.textContent('.game-info-value').catch(() => 'Unknown');
    console.log(`Current game status: ${status}`);
  }
}
