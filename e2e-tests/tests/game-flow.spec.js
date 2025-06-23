/**
 * E2E Tests for Chess Game Flow
 * Tests Scholar's Mate and Fool's Mate scenarios with real user interactions
 */

import { test, expect } from '@playwright/test';
import { ChessTestUtils } from '../utils/ChessTestUtils.js';
import { ChessGamePage } from '../pages/ChessGamePage.js';

test.describe('Chess Game Flow - Famous Checkmates', () => {
  let whitePlayerPage, blackPlayerPage;
  let whiteUtils, blackUtils;
  let whiteGamePage, blackGamePage;

  test.beforeEach(async ({ browser }) => {
    // Create two browser contexts for two players
    const whiteContext = await browser.newContext();
    const blackContext = await browser.newContext();
    
    whitePlayerPage = await whiteContext.newPage();
    blackPlayerPage = await blackContext.newPage();
    
    // Initialize utilities and page objects
    whiteUtils = new ChessTestUtils(whitePlayerPage);
    blackUtils = new ChessTestUtils(blackPlayerPage);
    whiteGamePage = new ChessGamePage(whitePlayerPage);
    blackGamePage = new ChessGamePage(blackPlayerPage);
  });

  test.afterEach(async () => {
    await whitePlayerPage?.close();
    await blackPlayerPage?.close();
  });

  test.describe('Scholar\'s Mate', () => {
    test('should complete Scholar\'s Mate with White winning in 4 moves', async () => {
      // User 1 (White) logs in and creates game
      await whiteUtils.loginUser('WhitePlayer', 'password123');
      const gameId = await whiteUtils.createGame('blitz');
      
      // Wait for game to load
      await whiteGamePage.waitForGameToLoad();
      
      // User 2 (Black) logs in and joins the game
      await blackUtils.loginUser('BlackPlayer', 'password123');
      await blackUtils.joinGame(gameId);
      
      // Wait for both players to be connected
      await whiteGamePage.waitForGameActive();
      await blackGamePage.waitForGameActive();
      
      // Verify initial setup
      await expect(whiteGamePage.whitePlayerDisplay).toContainText('WhitePlayer');
      await expect(blackGamePage.blackPlayerDisplay).toContainText('BlackPlayer');
      
      // Scholar's Mate sequence: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#
      
      // Move 1: White plays e4
      await whiteGamePage.waitForPlayerTurn('white');
      await whiteGamePage.makeMove('e2', 'e4');
      await whiteGamePage.verifyMove(1, 'e4');
      
      // Move 1: Black plays e5
      await blackGamePage.waitForPlayerTurn('black');
      await blackGamePage.makeMove('e7', 'e5');
      await blackGamePage.verifyMove(1, 'e5');
      
      // Move 2: White plays Bc4
      await whiteGamePage.waitForPlayerTurn('white');
      await whiteGamePage.makeMove('f1', 'c4');
      await whiteGamePage.verifyMove(2, 'Bc4');
      
      // Move 2: Black plays Nc6
      await blackGamePage.waitForPlayerTurn('black');
      await blackGamePage.makeMove('b8', 'c6');
      await blackGamePage.verifyMove(2, 'Nc6');
      
      // Move 3: White plays Qh5
      await whiteGamePage.waitForPlayerTurn('white');
      await whiteGamePage.makeMove('d1', 'h5');
      await whiteGamePage.verifyMove(3, 'Qh5');
      
      // Move 3: Black plays Nf6?? (the losing move)
      await blackGamePage.waitForPlayerTurn('black');
      await blackGamePage.makeMove('g8', 'f6');
      await blackGamePage.verifyMove(3, 'Nf6');
      
      // Move 4: White plays Qxf7# (checkmate!)
      await whiteGamePage.waitForPlayerTurn('white');
      await whiteGamePage.makeMove('h5', 'f7');
      
      // Wait for game to end and verify White wins
      await whiteGamePage.waitForTimeout(2000); // Allow time for game state to update
      
      // Verify game over and winner
      await expect(whiteGamePage.winnerMessage).toBeVisible({ timeout: 10000 });
      await expect(blackGamePage.winnerMessage).toBeVisible({ timeout: 10000 });
      
      // Check that White wins
      const whiteWinner = await whiteGamePage.getWinner();
      const blackWinner = await blackGamePage.getWinner();
      
      expect(whiteWinner).toBe('white');
      expect(blackWinner).toBe('white');
      
      // Verify winner message contains correct text
      await expect(whitePlayerPage.locator('text=/White.*wins!|WhitePlayer.*wins!/')).toBeVisible();
      await expect(blackPlayerPage.locator('text=/White.*wins!|WhitePlayer.*wins!/')).toBeVisible();
      
      // Take final screenshots
      await whiteUtils.takeScreenshot('scholars-mate-white-final');
      await blackUtils.takeScreenshot('scholars-mate-black-final');
      
      console.log('✅ Scholar\'s Mate completed successfully! White wins by checkmate.');
    });
  });

  test.describe('Fool\'s Mate', () => {
    test('should complete Fool\'s Mate with Black winning in 2 moves', async () => {
      // User 1 (White) logs in and creates game
      await whiteUtils.loginUser('WhitePlayer2', 'password123');
      const gameId = await whiteUtils.createGame('blitz');
      
      // Wait for game to load
      await whiteGamePage.waitForGameToLoad();
      
      // User 2 (Black) logs in and joins the game
      await blackUtils.loginUser('BlackPlayer2', 'password123');
      await blackUtils.joinGame(gameId);
      
      // Wait for both players to be connected
      await whiteGamePage.waitForGameActive();
      await blackGamePage.waitForGameActive();
      
      // Verify initial setup
      await expect(whiteGamePage.whitePlayerDisplay).toContainText('WhitePlayer2');
      await expect(blackGamePage.blackPlayerDisplay).toContainText('BlackPlayer2');
      
      // Fool's Mate sequence: 1.f3 e5 2.g4 Qh4#
      
      // Move 1: White plays f3 (the first bad move)
      await whiteGamePage.waitForPlayerTurn('white');
      await whiteGamePage.makeMove('f2', 'f3');
      await whiteGamePage.verifyMove(1, 'f3');
      
      // Move 1: Black plays e5
      await blackGamePage.waitForPlayerTurn('black');
      await blackGamePage.makeMove('e7', 'e5');
      await blackGamePage.verifyMove(1, 'e5');
      
      // Move 2: White plays g4 (the second bad move)
      await whiteGamePage.waitForPlayerTurn('white');
      await whiteGamePage.makeMove('g2', 'g4');
      await whiteGamePage.verifyMove(2, 'g4');
      
      // Move 2: Black plays Qh4# (checkmate!)
      await blackGamePage.waitForPlayerTurn('black');
      await blackGamePage.makeMove('d8', 'h4');
      
      // Wait for game to end and verify Black wins
      await blackGamePage.waitForTimeout(2000); // Allow time for game state to update
      
      // Verify game over and winner
      await expect(whiteGamePage.winnerMessage).toBeVisible({ timeout: 10000 });
      await expect(blackGamePage.winnerMessage).toBeVisible({ timeout: 10000 });
      
      // Check that Black wins
      const whiteWinner = await whiteGamePage.getWinner();
      const blackWinner = await blackGamePage.getWinner();
      
      expect(whiteWinner).toBe('black');
      expect(blackWinner).toBe('black');
      
      // Verify winner message contains correct text
      await expect(whitePlayerPage.locator('text=/Black.*wins!|BlackPlayer2.*wins!/')).toBeVisible();
      await expect(blackPlayerPage.locator('text=/Black.*wins!|BlackPlayer2.*wins!/')).toBeVisible();
      
      // Take final screenshots
      await whiteUtils.takeScreenshot('fools-mate-white-final');
      await blackUtils.takeScreenshot('fools-mate-black-final');
      
      console.log('✅ Fool\'s Mate completed successfully! Black wins by checkmate.');
    });
  });

  test.describe('Game Setup and Flow Validation', () => {
    test('should handle complete user journey from landing to game creation', async () => {
      // Test the complete flow for user 1
      await whitePlayerPage.goto('/');
      
      // Should see landing page
      await expect(whitePlayerPage.locator('h1')).toBeVisible();
      
      // Navigate to auth
      await whitePlayerPage.goto('/auth');
      
      // Login
      await whiteUtils.loginUser('TestWhite', 'password123');
      
      // Should be on setup page
      await expect(whitePlayerPage.locator('text=Setup New Game')).toBeVisible();
      await expect(whitePlayerPage.locator('text=Welcome back, TestWhite!')).toBeVisible();
      
      // Create game
      const gameId = await whiteUtils.createGame('rapid');
      
      // Should be on game page
      await expect(whitePlayerPage.locator('text=Chess Game')).toBeVisible();
      await expect(whitePlayerPage.locator('text=Waiting for opponent')).toBeVisible();
      
      // Game ID should be displayed
      const displayedGameId = await whiteGamePage.getGameId();
      expect(displayedGameId).toBe(gameId);
      
      console.log('✅ Complete user journey validation passed.');
    });

    test('should handle game joining flow correctly', async () => {
      // User 1 creates game
      await whiteUtils.loginUser('Creator', 'password123');
      const gameId = await whiteUtils.createGame('bullet');
      const gameLink = await whiteGamePage.shareGameLink();
      
      // User 2 joins via game link
      await blackUtils.loginUser('Joiner', 'password123');
      await blackPlayerPage.goto(gameLink);
      
      // Should see join game option
      await expect(blackGamePage.joinGameButton).toBeVisible();
      
      // Join the game
      await blackGamePage.joinGame();
      
      // Both users should now see active game
      await whiteGamePage.waitForGameActive();
      await blackGamePage.waitForGameActive();
      
      // Verify both players are shown
      await expect(whiteGamePage.whitePlayerDisplay).toContainText('Creator');
      await expect(whiteGamePage.blackPlayerDisplay).toContainText('Joiner');
      await expect(blackGamePage.whitePlayerDisplay).toContainText('Creator');
      await expect(blackGamePage.blackPlayerDisplay).toContainText('Joiner');
      
      console.log('✅ Game joining flow validation passed.');
    });
  });
});
