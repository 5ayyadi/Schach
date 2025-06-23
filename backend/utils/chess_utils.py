"""
Chess Utilities - Move validation and game state detection

Uses python-chess for:
- Move validation
- Game end detection (checkmate, stalemate, etc.)
- FEN handling
"""

import chess
from typing import Tuple, Optional


def validate_and_apply_move(fen: str, move_uci: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate a move and return the resulting FEN
    
    Args:
        fen: Current board position in FEN notation
        move_uci: Move in UCI format (e.g., 'e2e4')
    
    Returns:
        Tuple of (success, new_fen, error_message)
    """
    try:
        board = chess.Board(fen)
        move = chess.Move.from_uci(move_uci)
        
        if move not in board.legal_moves:
            return False, None, "Illegal move"
        
        board.push(move)
        return True, board.fen(), None
        
    except ValueError as e:
        return False, None, f"Invalid move format: {str(e)}"
    except Exception as e:
        return False, None, f"Move validation error: {str(e)}"


def detect_game_end(fen: str) -> Tuple[bool, Optional[str]]:
    """
    Check if the game has ended and determine the result
    
    Args:
        fen: Current board position in FEN notation
    
    Returns:
        Tuple of (game_ended, result)
        result can be 'white', 'black', 'draw', or None
    """
    try:
        board = chess.Board(fen)
        
        if board.is_checkmate():
            # The player whose turn it is has been checkmated
            winner = "white" if not board.turn else "black"
            return True, winner
        
        elif (board.is_stalemate() or 
              board.is_insufficient_material() or 
              board.is_seventyfive_moves() or 
              board.is_repetition(3)):
            return True, "draw"
        
        return False, None
        
    except Exception:
        return False, None


def get_turn_from_fen(fen: str) -> str:
    """
    Get whose turn it is from a FEN string
    
    Args:
        fen: Board position in FEN notation
    
    Returns:
        'white' or 'black'
    """
    try:
        board = chess.Board(fen)
        return "white" if board.turn else "black"
    except:
        return "white"  # Default to white


def is_valid_fen(fen: str) -> bool:
    """
    Check if a FEN string is valid
    
    Args:
        fen: FEN string to validate
    
    Returns:
        True if valid, False otherwise
    """
    try:
        chess.Board(fen)
        return True
    except:
        return False


def get_starting_fen() -> str:
    """
    Get the starting chess position in FEN notation
    
    Returns:
        Starting position FEN string
    """
    return chess.STARTING_FEN
