import { test } from '@playwright/test';
import { ChessTestUtils } from '../utils/ChessTestUtils.js';

test('Fastest Stalemate', async ({ browser }) => {
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
    
    // Execute the fastest stalemate sequence
    // 1.d3 a5
    await player1.makeMove('d2', 'd3');
    await player2.waitForPlayerTurn('black');
    await player2.makeMove('a7', 'a5');
    await player1.waitForPlayerTurn('white');
    
    // 2.Qd2 Ra6
    await player1.makeMove('d1', 'd2');
    await player2.waitForPlayerTurn('black');
    await player2.makeMove('a8', 'a6');
    await player1.waitForPlayerTurn('white');
    
    // 3.Qxa5 h5
    await player1.makeMove('d2', 'a5');
    await player2.waitForPlayerTurn('black');
    await player2.makeMove('h7', 'h5');
    await player1.waitForPlayerTurn('white');
    
    // 4.h4 Rah6
    await player1.makeMove('h2', 'h4');
    await player2.waitForPlayerTurn('black');
    await player2.makeMove('a6', 'h6');
    await player1.waitForPlayerTurn('white');
    
    // 5.Qxc7 f6
    await player1.makeMove('a5', 'c7');
    await player2.waitForPlayerTurn('black');
    await player2.makeMove('f7', 'f6');
    await player1.waitForPlayerTurn('white');
    
    // 6.Qxd7+ Kf7
    await player1.makeMove('c7', 'd7');
    await player2.waitForPlayerTurn('black');
    await player2.makeMove('e8', 'f7');
    await player1.waitForPlayerTurn('white');
    
    // 7.Qxb7 Qxd3
    await player1.makeMove('d7', 'b7');
    await player2.waitForPlayerTurn('black');
    await player2.makeMove('d8', 'd3');
    await player1.waitForPlayerTurn('white');
    
    // 8.Qxb8 Qh7
    await player1.makeMove('b7', 'b8');
    await player2.waitForPlayerTurn('black');
    await player2.makeMove('d3', 'h7');
    await player1.waitForPlayerTurn('white');
    
    // 9.Qxc8 Kg6
    await player1.makeMove('b8', 'c8');
    await player2.waitForPlayerTurn('black');
    await player2.makeMove('f7', 'g6');
    await player1.waitForPlayerTurn('white');
    
    // 10.Qe6 - Results in stalemate
    await player1.makeMove('c8', 'e6');
    
    // Verify game ended in stalemate
    await player1.waitForGameEnd('draw');
    await player2.waitForGameEnd('draw');
    
  } finally {
    // Safe context cleanup with Promise.allSettled
    await Promise.allSettled([
      context1?.isClosed?.() === false ? context1.close() : Promise.resolve(),
      context2?.isClosed?.() === false ? context2.close() : Promise.resolve()
    ]);
  }
});
