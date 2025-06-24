import { test } from '@playwright/test';
import { ChessTestUtils } from '../utils/ChessTestUtils.js';

test('Fool\'s Mate - Blitz Game', async ({ browser }) => {
  // Create two browser contexts for two players
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  const player1 = new ChessTestUtils(page1);
  const player2 = new ChessTestUtils(page2);
  
  try {
    // Player 1 (White) logs in and creates game
    await player1.ensureUserLoggedIn('white_player', 'password123');
    const gameId = await player1.createGame('3+2');
    
    // Player 2 (Black) logs in and joins game
    await player2.ensureUserLoggedIn('black_player', 'password123');
    await player2.joinGame(gameId);
    
    // Wait for both players to be connected
    await player1.waitForBothPlayers();
    await player2.waitForBothPlayers();
    
    // Execute Fool's Mate sequence
    // 1.f3
    await player1.makeMove('f2', 'f3');
    await player2.waitForPlayerTurn('black');
    
    // 1...e5
    await player2.makeMove('e7', 'e5');
    await player1.waitForPlayerTurn('white');
    
    // 2.g4
    await player1.makeMove('g2', 'g4');
    await player2.waitForPlayerTurn('black');
    
    // 2...Qh4# (checkmate)
    await player2.makeMove('d8', 'h4');
    
    // Verify game ended with black victory
    await player1.waitForGameEnd('black');
    await player2.waitForGameEnd('black');
    
  } finally {
    await context1.close();
    await context2.close();
  }
});