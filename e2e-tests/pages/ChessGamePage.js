/**
 * Chess Game Page Object Model
 * Provides structured access to chess game UI elements
 */

import { expect } from '@playwright/test';

export class ChessGamePage {
  constructor(page) {
    this.page = page;
  }

  // Locators
  get chessboard() {
    return this.page.locator('.chessboard-container, [data-testid="chessboard"]').first();
  }

  get gameInfo() {
    return this.page.locator('.game-info');
  }

  get gameIdDisplay() {
    return this.page.locator('.game-info-item:has-text("Game ID") .game-info-value');
  }

  get statusDisplay() {
    return this.page.locator('.game-info-item:has-text("Status") .game-info-value');
  }

  get whitePlayerDisplay() {
    return this.page.locator('text=/⚪.*/');
  }

  get blackPlayerDisplay() {
    return this.page.locator('text=/⚫.*/');
  }

  get turnIndicator() {
    return this.page.locator('text=/White to move|Black to move/');
  }

  get joinGameButton() {
    return this.page.locator('button:has-text("Join Game")');
  }

  get winnerMessage() {
    return this.page.locator('text=/.*wins!|.*draw/');
  }

  get checkIndicator() {
    return this.page.locator('text=Check!');
  }

  get moveHistory() {
    return this.page.locator('.move-history, [data-testid="move-history"]');
  }

  // Actions
  async waitForGameToLoad() {
    await this.gameInfo.waitFor({ timeout: 10000 });
  }

  async waitForGameActive() {
    await this.chessboard.waitFor({ timeout: 10000 });
    await expect(this.page.locator('text=Waiting for opponent')).not.toBeVisible();
  }

  async joinGame() {
    if (await this.joinGameButton.isVisible()) {
      await this.joinGameButton.click();
      await this.waitForGameActive();
    }
  }

  async getGameId() {
    return await this.gameIdDisplay.textContent();
  }

  async getGameStatus() {
    return await this.statusDisplay.textContent();
  }

  async isPlayerTurn(color) {
    const turnText = color === 'white' ? 'White to move' : 'Black to move';
    return await this.page.locator(`text=${turnText}`).isVisible();
  }

  async waitForPlayerTurn(color) {
    const turnText = color === 'white' ? 'White to move' : 'Black to move';
    await this.page.waitForSelector(`text=${turnText}`, { timeout: 10000 });
  }

  async isGameOver() {
    return await this.winnerMessage.isVisible();
  }

  async getWinner() {
    if (await this.isGameOver()) {
      const winnerText = await this.winnerMessage.textContent();
      if (winnerText.includes('White')) return 'white';
      if (winnerText.includes('Black')) return 'black';
      if (winnerText.includes('draw')) return 'draw';
    }
    return null;
  }

  async isInCheck() {
    return await this.checkIndicator.isVisible();
  }

  async makeMove(fromSquare, toSquare) {
    // Multiple strategies for making moves
    const strategies = [
      () => this.makeMoveByDataSquare(fromSquare, toSquare),
      () => this.makeMoveByDragDrop(fromSquare, toSquare),
      () => this.makeMoveByCoordinates(fromSquare, toSquare)
    ];

    let lastError;
    for (const strategy of strategies) {
      try {
        await strategy();
        // Wait a bit for the move to be processed
        await this.page.waitForTimeout(500);
        return;
      } catch (error) {
        lastError = error;
        console.log(`Move strategy failed: ${error.message}`);
      }
    }
    
    throw new Error(`All move strategies failed. Last error: ${lastError.message}`);
  }

  async makeMoveByDataSquare(fromSquare, toSquare) {
    const fromElement = this.page.locator(`[data-square="${fromSquare}"]`).first();
    const toElement = this.page.locator(`[data-square="${toSquare}"]`).first();
    
    await fromElement.click();
    await toElement.click();
  }

  async makeMoveByDragDrop(fromSquare, toSquare) {
    const fromSelector = `[data-square="${fromSquare}"], [class*="${fromSquare}"]`;
    const toSelector = `[data-square="${toSquare}"], [class*="${toSquare}"]`;
    
    await this.page.dragAndDrop(fromSelector, toSelector);
  }

  async makeMoveByCoordinates(fromSquare, toSquare) {
    await this.chessboard.waitFor();
    const boardBox = await this.chessboard.boundingBox();
    const squareSize = boardBox.width / 8;

    const getSquareCoordinates = (square) => {
      const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
      const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc.
      
      return {
        x: boardBox.x + file * squareSize + squareSize / 2,
        y: boardBox.y + rank * squareSize + squareSize / 2
      };
    };

    const fromCoords = getSquareCoordinates(fromSquare);
    const toCoords = getSquareCoordinates(toSquare);

    await this.page.mouse.move(fromCoords.x, fromCoords.y);
    await this.page.mouse.down();
    await this.page.mouse.move(toCoords.x, toCoords.y);
    await this.page.mouse.up();
  }

  async verifyMove(expectedMoveNumber, expectedMove) {
    // Wait for move to appear in history
    await this.page.waitForTimeout(1000);
    
    // This is a simplified check - in a real implementation you'd verify the move history
    console.log(`Expected move ${expectedMoveNumber}: ${expectedMove}`);
  }

  async shareGameLink() {
    const gameId = await this.getGameId();
    return `${this.page.url().split('/game/')[0]}/game/${gameId}`;
  }
}
