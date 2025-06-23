/**
 * Scholar's Mate E2E Test
 * Focused test for the Scholar's Mate checkmate pattern
 */

import { test, expect } from '@playwright/test';
import { ChessTestUtils } from '../utils/ChessTestUtils.js';
import { ChessGamePage } from '../pages/ChessGamePage.js';

test.describe('Scholar\'s Mate - Individual Test', () => {
  test('Scholar\'s Mate: White wins in 4 moves (1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#)', async ({ browser }) => {
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
      await whiteUtils.loginUser('ScholarWhite', 'password123');
      const gameId = await whiteUtils.createGame('blitz');
      
      // Setup: Black player joins
      await blackUtils.loginUser('ScholarBlack', 'password123');
      await blackUtils.joinGame(gameId, 'ScholarBlack', 'password123');
      
      // Wait for game to be active
      await whiteGamePage.waitForGameActive();
      await blackGamePage.waitForGameActive();
      
      console.log('🎯 Starting Scholar\'s Mate sequence...');
      
      // Move 1: e4 e5
      await whiteGamePage.makeMove('e2', 'e4');
      console.log('✓ White: 1.e4');
      
      await blackGamePage.makeMove('e7', 'e5');
      console.log('✓ Black: 1...e5');
      
      // Move 2: Bc4 Nc6
      await whiteGamePage.makeMove('f1', 'c4');
      console.log('✓ White: 2.Bc4');
      
      await blackGamePage.makeMove('b8', 'c6');
      console.log('✓ Black: 2...Nc6');
      
      // Move 3: Qh5 Nf6??
      await whiteGamePage.makeMove('d1', 'h5');
      console.log('✓ White: 3.Qh5');
      
      await blackGamePage.makeMove('g8', 'f6');
      console.log('✓ Black: 3...Nf6?? (the blunder!)');
      
      // Move 4: Qxf7# (checkmate)
      await whiteGamePage.makeMove('h5', 'f7');
      console.log('✓ White: 4.Qxf7# (CHECKMATE!)');
      
      // Verify checkmate
      await expect(whiteGamePage.winnerMessage).toBeVisible({ timeout: 10000 });
      await expect(blackGamePage.winnerMessage).toBeVisible({ timeout: 10000 });
      
      const winner = await whiteGamePage.getWinner();
      expect(winner).toBe('white');
      
      console.log('🎉 Scholar\'s Mate completed! White wins by checkmate in 4 moves.');
      
    } finally {
      await whitePlayerPage.close();
      await blackPlayerPage.close();
    }
  });
});