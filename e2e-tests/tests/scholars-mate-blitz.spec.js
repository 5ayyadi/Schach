import { test } from '@playwright/test';
import { ChessTestUtils } from '../utils/ChessTestUtils.js';

test('Scholar\'s Mate - Blitz Game', async ({ browser }) => {
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
    
    // Execute Scholar's Mate sequence
    // 1.e4
    await player1.makeMove('e2', 'e4');
    await player2.waitForPlayerTurn('black');
    
    // 1...e5
    await player2.makeMove('e7', 'e5');
    await player1.waitForPlayerTurn('white');
    
    // 2.Bc4
    await player1.makeMove('f1', 'c4');
    await player2.waitForPlayerTurn('black');
    
    // 2...Nc6
    await player2.makeMove('b8', 'c6');
    await player1.waitForPlayerTurn('white');
    
    // 3.Qh5
    await player1.makeMove('d1', 'h5');
    await player2.waitForPlayerTurn('black');
    
    // 3...Nf6
    await player2.makeMove('g8', 'f6');
    await player1.waitForPlayerTurn('white');
    
    // 4.Qxf7# (checkmate)
    await player1.makeMove('h5', 'f7');
    
    // Verify game ended with white victory
    await player1.waitForGameEnd('white');
    await player2.waitForGameEnd('white');
    
  } finally {
    await context1.close();
    await context2.close();
  }
});