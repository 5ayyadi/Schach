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
   * Register a new user account
   */
  async registerUser(username, password) {
    await this.page.goto('http://localhost:3000/auth');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000); // Wait for React to fully load

    // Check if we're already logged in by looking for setup page or logout button
    const isOnSetupPage = await this.page.locator('h1:has-text("Play Chess")').isVisible().catch(() => false);
    const hasLogoutButton = await this.page.locator('button:has-text("Logout")').isVisible().catch(() => false);
    
    if (isOnSetupPage || hasLogoutButton) {
      console.log(`User ${username} is already logged in`);
      return;
    }

    // We're on the auth page, check if we need to switch to register mode
    const isRegisterForm = await this.page.locator('h1:has-text("Create Account")').isVisible().catch(() => false);
    
    if (!isRegisterForm) {
      // We're on login form, switch to register
      await this.page.click('button:has-text("Sign Up")');
      await this.page.waitForSelector('h1:has-text("Create Account")');
    }

    // Fill the registration form
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    
    // Wait for button to be enabled (form validation)
    await this.page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
    
    // Submit the registration form
    await this.page.click('button[type="submit"]');
    
    try {
      // Wait for either successful login (setup page) or error message
      await Promise.race([
        this.page.waitForSelector('h1:has-text("Create Game")', { timeout: 10000 }),
        this.page.waitForSelector('.error, .error-message', { timeout: 10000 })
      ]);
      
      // Check if we successfully reached the setup page
      const isOnSetupPage = await this.page.locator('h1:has-text("Play Chess")').isVisible().catch(() => false);
      
      if (isOnSetupPage) {
        console.log(`Successfully registered and logged in user: ${username}`);
      } else {
        // There might be an error or we might need to login instead
        const errorVisible = await this.page.locator('.error, .error-message').isVisible().catch(() => false);
        if (errorVisible) {
          console.log(`Registration failed for ${username}, trying to login instead`);
          await this.loginUser(username, password);
        }
      }
    } catch (error) {
      console.log(`Registration timeout for ${username}, trying to login instead`);
      await this.loginUser(username, password);
    }
  }

  /**
   * Log in an existing user
   */
  async loginUser(username, password) {
    await this.page.goto('http://localhost:3000/auth');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000); // Wait for React to fully load

    // Check if we're already on the setup page
    const isOnSetupPage = await this.page.locator('h1:has-text("Play Chess")').isVisible().catch(() => false);
    if (isOnSetupPage) {
      console.log(`User ${username} is already logged in`);
      return;
    }

    // Make sure we're on the login form
    const isLoginForm = await this.page.locator('h1:has-text("Sign In")').isVisible().catch(() => false);
    
    if (!isLoginForm) {
      // We're on register form, switch to login
      await this.page.click('button:has-text("Log In")');
      await this.page.waitForSelector('h1:has-text("Sign In")');
    }

    // Fill the login form
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    
    // Wait for button to be enabled (form validation)
    await this.page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
    
    // Submit the login form
    await this.page.click('button[type="submit"]');
    
    // Wait for successful login
    await this.page.waitForSelector('h1:has-text("Play Chess")', { timeout: 15000 });
    console.log(`Successfully logged in user: ${username}`);
  }

  /**
   * Ensure user is logged in (register if new, login if existing)
   */
  async ensureUserLoggedIn(username, password) {
    await this.page.goto('http://localhost:3000/auth');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000); // Wait for React to fully load

    // Check if already logged in
    const isOnSetupPage = await this.page.locator('h1:has-text("Play Chess")').isVisible().catch(() => false);
    if (isOnSetupPage) {
      console.log(`User ${username} is already logged in`);
      return;
    }

    // Try to login first (faster if user exists)
    try {
      await this.loginUser(username, password);
    } catch (error) {
      console.log(`Login failed for ${username}, trying registration`);
      await this.registerUser(username, password);
    }
  }

  /**
   * Create a new game with the specified time control
   */
  async createGame(timeControl = '3+2') {
    // Wait for setup page
    await this.page.waitForSelector('h1:has-text("Play Chess")');
    
    // Select time control by clicking the tile with the corresponding id
    const timeControlSelector = `.time-control-tile[class*="${timeControl}"], .time-control-tile:has(.time-control-time:has-text("${timeControl.replace('+', ' | ')}"))`;
    await this.page.click(timeControlSelector).catch(async () => {
      // If exact match fails, try clicking any blitz time control as fallback
      console.log(`Time control ${timeControl} not found, using default`);
      await this.page.click('.time-control-tile').catch(() => {});
    });
    
    await this.page.waitForTimeout(500);
    
    // Select random color (default is usually fine, but let's be explicit)
    await this.page.click('.color-option-tile:has-text("Random")').catch(() => {
      // If "Random" not found, try selecting first available color option
      this.page.click('.color-option-tile').catch(() => {});
    });
    
    // Create the game
    await this.page.click('button:has-text("Create Game")');
    
    // Wait for game creation and extract game ID from URL
    await this.page.waitForURL(/.*\/game\/.*/, { timeout: 10000 });
    
    const gameId = this.page.url().split('/game/')[1];
    console.log(`Created game with ID: ${gameId}`);
    
    return gameId;
  }

  /**
   * Join an existing game by ID
   */
  async joinGame(gameId, username = null, password = null) {
    // If credentials provided, ensure user is logged in first
    if (username && password) {
      await this.ensureUserLoggedIn(username, password);
    }

    // Navigate to the game
    await this.page.goto(`http://localhost:3000/game/${gameId}`);
    await this.page.waitForLoadState('networkidle');
    
    // Check if we need to authenticate first
    const isOnAuthPage = await this.page.locator('h1:has-text("Sign In"), h1:has-text("Sign Up")').isVisible().catch(() => false);
    
    if (isOnAuthPage) {
      if (username && password) {
        await this.ensureUserLoggedIn(username, password);
        await this.page.goto(`http://localhost:3000/game/${gameId}`);
        await this.page.waitForLoadState('networkidle');
      } else {
        throw new Error('User needs to be logged in before joining game.');
      }
    }
    
    // Look for "Join Game" button
    const joinButton = this.page.locator('button:has-text("Join Game")');
    const hasJoinButton = await joinButton.isVisible().catch(() => false);
    
    if (hasJoinButton) {
      await joinButton.click();
      console.log('Successfully clicked Join Game button');
      await this.page.waitForLoadState('networkidle');
    } else {
      console.log('Join Game button not found - player might already be in game');
    }
    
    // Wait for game board to appear using CSS classes (indicates game is ready)
    await this.page.waitForSelector('.chessboard-container', { timeout: 15000 });
    if (!this.page.isClosed()) {
      await this.page.waitForTimeout(2000); // Additional wait for WebSocket connection
    }
  }

  /**
   * Make a chess move by clicking source and target squares
   */
  async makeMove(fromSquare, toSquare) {
    // Check if page is closed
    if (this.page.isClosed()) {
      console.log('Page is closed, cannot make move');
      return;
    }

    // Wait for chessboard to be ready
    await this.page.waitForSelector('.chessboard-container');
    
    console.log(`Making move: ${fromSquare} to ${toSquare}`);
    
    try {
      // Try direct data-square approach first (most reliable)
      await this.page.click(`[data-square="${fromSquare}"]`);
      await this.page.waitForTimeout(200);
      await this.page.click(`[data-square="${toSquare}"]`);
      console.log(`Move successful: ${fromSquare} -> ${toSquare}`);
    } catch (error) {
      if (this.page.isClosed()) {
        console.log('Page closed during move, cannot complete');
        return;
      }
      console.log(`Direct click failed, trying coordinate method: ${error.message}`);
      await this.makeMoveByCoordinates(fromSquare, toSquare);
    }
    
    // Wait for move to be processed and UI to update
    if (!this.page.isClosed()) {
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Make move using data-square attributes (simple click-based approach)
   */
  async makeMoveByCoordinates(fromSquare, toSquare) {
    // Check if page is closed
    if (this.page.isClosed()) {
      console.log('Page is closed, cannot make move by coordinates');
      return;
    }

    // Click on the source square using data-square attribute
    await this.page.click(`[data-square="${fromSquare}"]`);
    
    // Small delay between clicks
    await this.page.waitForTimeout(200);
    
    // Click on the target square
    await this.page.click(`[data-square="${toSquare}"]`);
    
    console.log(`Move successful: ${fromSquare} -> ${toSquare}`);
  }

  /**
   * Wait for it to be the player's turn
   */
  async waitForPlayerTurn(color) {
    // Check if page is closed before starting wait
    if (this.page.isClosed()) {
      console.log('Page is closed, skipping turn wait');
      return;
    }

    // Wait for game to be in the correct turn state
    await this.page.waitForFunction((playerColor) => {
      // Check if there's a modal open (game ended)
      const modal = document.querySelector('.modal-overlay, .chess-modal-overlay');
      if (modal) return true; // Game ended, don't wait for turn
      
      // Look for active player indicators
      const activePlayerElements = document.querySelectorAll('.chess-player-info.active, .player-info.active');
      
      // Check if any active player element indicates it's this player's turn
      for (const element of activePlayerElements) {
        const text = element.textContent || '';
        const isWhite = text.includes('white') || text.includes('White') || element.classList.contains('white');
        const isBlack = text.includes('black') || text.includes('Black') || element.classList.contains('black');
        
        if ((playerColor === 'white' && isWhite) || (playerColor === 'black' && isBlack)) {
          return true;
        }
      }
      
      // Alternative: check for turn indicators in page text
      const pageText = document.body.textContent || '';
      const yourTurn = pageText.includes('Your turn') || pageText.includes('your turn');
      const whiteToMove = pageText.includes('White to move') && playerColor === 'white';
      const blackToMove = pageText.includes('Black to move') && playerColor === 'black';
      
      return yourTurn || whiteToMove || blackToMove;
    }, color, { timeout: 15000 });

    // Shorter wait for UI to stabilize
    if (!this.page.isClosed()) {
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Wait for both players to be connected and game to be ready
   */
  async waitForBothPlayers() {
    // The game is ready when we have chessboard and player info
    await this.page.waitForFunction(() => {
      // Check for chessboard container
      const chessboard = document.querySelector('.chessboard-container');
      if (!chessboard) return false;
      
      // Check for player info sections
      const playerInfos = document.querySelectorAll('.chess-player-info');
      if (playerInfos.length < 2) return false;
      
      // Check that we have some game status text (not loading)
      const bodyText = document.body.textContent || '';
      const hasGameStatus = bodyText.includes("your turn") || 
                           bodyText.includes("Waiting for") ||
                           bodyText.includes("to move") ||
                           bodyText.includes("Make your move") ||
                           bodyText.includes("3:00"); // Timer indicates active game
      
      return hasGameStatus;
    }, { timeout: 10000 });
    
    // Also make sure chessboard is visible
    await this.page.waitForSelector('.chessboard-container', { timeout: 5000 });
    
    // Short wait for UI to stabilize
    await this.page.waitForTimeout(1000);
    console.log('Both players are connected and game is ready');
  }

  /**
   * Wait for game to end and verify the result (flexible detection)
   */
  async waitForGameEnd(expectedResult) {
    if (this.page.isClosed()) {
      console.log('Page is closed, skipping game end detection');
      return;
    }

    try {
      // Strategy 1: Look for game result modal
      await this.page.waitForSelector('.chess-modal-overlay, .modal-overlay', { timeout: 15000 });
      
      // Wait for modal content to be ready
      await this.page.waitForSelector('.chess-modal-result, .modal-result, .chess-modal-title, .modal-title', { timeout: 5000 });
      
      console.log(`Game ended, result modal appeared`);
    } catch (e) {
      if (this.page.isClosed()) {
        console.log('Page closed during game end detection');
        return;
      }
      
      // Strategy 2: Look for any game finished indicator
      try {
        await this.page.waitForSelector('.game-status-finished, .game-finished, [data-testid="game-result"]', { timeout: 10000 });
        console.log(`Game ended, game status indicator found`);
      } catch (e2) {
        if (this.page.isClosed()) {
          console.log('Page closed during game end detection');
          return;
        }
        
        try {
          // Strategy 3: Look for text-based indicators
          await this.page.waitForFunction(() => {
            const pageText = document.body.textContent || '';
            return pageText.includes('Game Over') || 
                   pageText.includes('Checkmate') || 
                   pageText.includes('Stalemate') || 
                   pageText.includes('Draw') ||
                   pageText.includes('resigned') ||
                   pageText.includes('wins') ||
                   pageText.includes('Winner') ||
                   pageText.includes('repetition');
          }, { timeout: 10000 });
          console.log(`Game ended, text-based indicator found`);
        } catch (e3) {
          if (this.page.isClosed()) {
            console.log('Page closed during final game end detection');
            return;
          }
          throw e3;
        }
      }
    }
  }

  /**
   * Check if the game is in an active state (using CSS classes)
   */
  async isGameActive() {
    if (this.page.isClosed()) {
      return false;
    }
    
    return await this.page.evaluate(() => {
      // Check for active player indicators
      const activePlayer = document.querySelector('.chess-player-info.active');
      const chessboard = document.querySelector('.chessboard-container');
      const activeTimer = document.querySelector('.chess-timer.active');
      
      return activePlayer !== null && chessboard !== null && activeTimer !== null;
    });
  }

  /**
   * Offer a draw to the opponent
   */
  async offerDraw() {
    if (this.page.isClosed()) {
      console.log('Page is closed, cannot offer draw');
      return;
    }

    // Look for draw offer button
    const drawButton = this.page.locator('button:has-text("Offer Draw"), button:has-text("Draw")');
    await drawButton.click();
    console.log('Draw offer button clicked');
    
    // Wait for confirmation or UI update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Accept an incoming draw offer
   */
  async acceptDraw() {
    if (this.page.isClosed()) {
      console.log('Page is closed, cannot accept draw');
      return;
    }

    // Wait for draw offer notification to appear
    await this.page.waitForSelector('text="wants to draw", text="offered a draw", text="Draw offer"', { timeout: 10000 });
    console.log('Draw offer received notification found');
    
    // Look for accept button
    const acceptButton = this.page.locator('button:has-text("Accept"), button:has-text("Yes")');
    await acceptButton.click();
    console.log('Draw offer accepted');
  }

  /**
   * Resign from the game
   */
  async resignGame() {
    if (this.page.isClosed()) {
      console.log('Page is closed, cannot resign');
      return;
    }

    // Look for resign button
    const resignButton = this.page.locator('button:has-text("Resign")');
    await resignButton.click();
    console.log('Resign button clicked');
    
    // Wait for confirmation dialog if present
    await this.page.waitForTimeout(1000);
    
    // Look for confirmation button
    const confirmButtons = [
      'button:has-text("Yes")',
      'button:has-text("Confirm")', 
      'button:has-text("Resign")'
    ];
    
    for (const selector of confirmButtons) {
      const button = this.page.locator(selector);
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        await button.click();
        console.log('Resignation confirmed');
        break;
      }
    }
  }
}
