/**
 * Fool's Mate E2E Test
 * Focused test for the Fool's Mate checkmate pattern (fastest possible checkmate)
 */

import { test, expect } from '@playwright/test';
import { ChessTestUtils } from '../utils/ChessTestUtils.js';
import { ChessGamePage } from '../pages/ChessGamePage.js';

test.describe('Fool\'s Mate - Individual Test', () => {
  test('Fool\'s Mate: Black wins in 2 moves (1.f3 e5 2.g4 Qh4#)', async ({ browser }) => {
    // Create two browser contexts for two players
    const whiteContext = await browser.newContext();
    const blackContext = await browser.newContext();
    
    const whitePlayerPage = await whiteContext.newPage();
    const blackPlayerPage = await blackContext.newPage();
    
    const whiteUtils = new ChessTestUtils(whitePlayerPage);
    const blackUtils = new ChessTestUtils(blackPlayerPage);
    const whiteGamePage = new ChessGamePage(whitePlayerPage);
    const blackGamePage = new ChessGamePage(blackPlayerPage);

    try {
      // Setup: White player creates game
      await whiteUtils.loginUser('FoolWhite', 'password123');
      const gameId = await whiteUtils.createGame('bullet');
      
      // Setup: Black player joins
      await blackUtils.loginUser('FoolBlack', 'password123');
      await blackUtils.joinGame(gameId, 'FoolBlack', 'password123');
      
      // Wait for game to be active
      await whiteGamePage.waitForGameActive();
      await blackGamePage.waitForGameActive();
      
      console.log('🎯 Starting Fool\'s Mate sequence (fastest checkmate possible)...');
      
      // Move 1: f3 e5
      await whiteGamePage.makeMove('f2', 'f3');
      console.log('✓ White: 1.f3 (bad move #1)');
      
      await blackGamePage.makeMove('e7', 'e5');
      console.log('✓ Black: 1...e5');
      
      // Move 2: g4 Qh4#
      await whiteGamePage.makeMove('g2', 'g4');
      console.log('✓ White: 2.g4 (bad move #2 - opens the king)');
      
      await blackGamePage.makeMove('d8', 'h4');
      console.log('✓ Black: 2...Qh4# (CHECKMATE!)');
      
      // Verify checkmate
      await expect(whiteGamePage.winnerMessage).toBeVisible({ timeout: 10000 });
      await expect(blackGamePage.winnerMessage).toBeVisible({ timeout: 10000 });
      
      const winner = await blackGamePage.getWinner();
      expect(winner).toBe('black');
      
      console.log('🎉 Fool\'s Mate completed! Black wins by checkmate in 2 moves (fastest possible).');
      
    } finally {
      await whitePlayerPage.close();
      await blackPlayerPage.close();
    }
  });
});