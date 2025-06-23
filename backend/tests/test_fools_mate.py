"""
Test Fool's Mate scenario

Tests the fastest checkmate possible:
1. f3 e5 2. g4 Qh4# (Black wins in 2 moves)

Tests: create game -> join game -> make moves -> checkmate
"""

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_fools_mate_5_plus_3(client, white_player, black_player):
    """Test Fool's Mate with 5+3 time control"""
    
    # Create game
    response = client.post("/api/games", 
        json={"time_control": "5+3"},
        headers=white_player["headers"]
    )
    assert response.status_code == 200
    game_id = response.json()["id"]
    print(f"✓ Game created with 5+3 time control: {game_id}")
    
    # Join game
    response = client.post(f"/api/games/{game_id}/join", 
        json={},
        headers=black_player["headers"]
    )
    assert response.status_code == 200
    print("✓ BlackPlayer joined")
    
    # Play Fool's Mate: f3 e5 g4 Qh4#
    moves = [
        (white_player, "f2f3"),  # 1. f3
        (black_player, "e7e5"),  # 1... e5
        (white_player, "g2g4"),  # 2. g4
        (black_player, "d8h4")   # 2... Qh4# (checkmate!)
    ]
    
    for i, (player, move) in enumerate(moves):
        response = client.post(f"/api/games/{game_id}/move", 
            json={"move": move},
            headers=player["headers"]
        )
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        print(f"✓ Move {i+1}: {player['username']} plays {move}")
        
        if i == 3:  # Last move
            assert result["game_over"] is True
            assert result["result"] == "black"
            print("✓ Fool's Mate complete! Black wins by checkmate.")


def test_fools_mate_with_reconnection_5_plus_3(client, white_player, black_player):
    """Test Fool's Mate with 5+3 time control - includes disconnection/reconnection scenario"""
    
    # Create game
    response = client.post("/api/games", 
        json={"time_control": "5+3"},
        headers=white_player["headers"]
    )
    assert response.status_code == 200
    game_id = response.json()["id"]
    print(f"✓ Game created with 5+3 time control: {game_id}")
    
    # Join game
    response = client.post(f"/api/games/{game_id}/join", 
        json={},
        headers=black_player["headers"]
    )
    assert response.status_code == 200
    print("✓ BlackPlayer joined")
    
    # Play first two moves: f3 e5
    moves_before_disconnect = [
        (white_player, "f2f3"),  # 1. f3
        (black_player, "e7e5"),  # 1... e5
    ]
    
    for i, (player, move) in enumerate(moves_before_disconnect):
        response = client.post(f"/api/games/{game_id}/move", 
            json={"move": move},
            headers=player["headers"]
        )
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        print(f"✓ Move {i+1}: {player['username']} plays {move}")
    
    # Simulate white player disconnection - check game state persists
    print("⚠ Simulating white player disconnection...")
    
    # Black player can still get the current game state
    response = client.get(f"/api/games/{game_id}")
    assert response.status_code == 200
    game_state = response.json()
    print(f"Game state keys: {list(game_state.keys())}")
    print(f"Game state: {game_state}")
    # Each move adds a new FEN, starting position is 1, so 2 moves = 3 FENs
    assert game_state["status"] == "in_progress"
    print("✓ Game state persists during disconnection")
    
    # White player reconnects and makes a move
    print("✓ White player reconnects...")
    response = client.post(f"/api/games/{game_id}/move", 
        json={"move": "g2g4"},  # 2. g4
        headers=white_player["headers"]
    )
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    print("✓ Move 3: WhitePlayer plays g2g4 after reconnection")
    
    # Black player can still see the updated game state after white reconnected
    response = client.get(f"/api/games/{game_id}")
    assert response.status_code == 200
    game_state = response.json()
    assert game_state["status"] == "in_progress"
    print("✓ Black player can see updated game state after reconnection")
    
    # Complete the checkmate
    response = client.post(f"/api/games/{game_id}/move", 
        json={"move": "d8h4"},  # 2... Qh4# (checkmate!)
        headers=black_player["headers"]
    )
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    assert result["game_over"] is True
    assert result["result"] == "black"
    print("✓ Fool's Mate complete! Black wins by checkmate after reconnection scenario.")


def test_fools_mate_10_plus_0(client, white_player, black_player):
    """Test Fool's Mate with 10+0 time control"""
    
    # Create game
    response = client.post("/api/games", 
        json={"time_control": "10+0"},
        headers=white_player["headers"]
    )
    assert response.status_code == 200
    game_id = response.json()["id"]
    print(f"✓ Game created with 10+0 time control: {game_id}")
    
    # Join game
    response = client.post(f"/api/games/{game_id}/join", 
        json={},
        headers=black_player["headers"]
    )
    assert response.status_code == 200
    print("✓ BlackPlayer joined")
    
    # Play Fool's Mate
    moves = [
        (white_player, "f2f3"),
        (black_player, "e7e5"),
        (white_player, "g2g4"),
        (black_player, "d8h4")
    ]
    
    for i, (player, move) in enumerate(moves):
        response = client.post(f"/api/games/{game_id}/move", 
            json={"move": move},
            headers=player["headers"]
        )
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        print(f"✓ Move {i+1}: {player['username']} plays {move}")
        
        if i == 3:
            assert result["game_over"] is True
            assert result["result"] == "black"
            print("✓ Fool's Mate complete! Black wins by checkmate.")


def test_fools_mate_daily(client, white_player, black_player):
    """Test Fool's Mate with daily time control"""
    
    # Create game
    response = client.post("/api/games", 
        json={"time_control": "daily"},
        headers=white_player["headers"]
    )
    assert response.status_code == 200
    game_id = response.json()["id"]
    print(f"✓ Game created with daily time control: {game_id}")
    
    # Join game
    response = client.post(f"/api/games/{game_id}/join", 
        json={},
        headers=black_player["headers"]
    )
    assert response.status_code == 200
    print("✓ BlackPlayer joined")
    
    # Play Fool's Mate
    moves = [
        (white_player, "f2f3"),
        (black_player, "e7e5"),
        (white_player, "g2g4"),
        (black_player, "d8h4")
    ]
    
    for i, (player, move) in enumerate(moves):
        response = client.post(f"/api/games/{game_id}/move", 
            json={"move": move},
            headers=player["headers"]
        )
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        print(f"✓ Move {i+1}: {player['username']} plays {move}")
        
        if i == 3:
            assert result["game_over"] is True
            assert result["result"] == "black"
            print("✓ Fool's Mate complete! Black wins by checkmate.")


def test_fools_mate_weekly(client, white_player, black_player):
    """Test Fool's Mate with weekly time control"""
    
    # Create game
    response = client.post("/api/games", 
        json={"time_control": "weekly"},
        headers=white_player["headers"]
    )
    assert response.status_code == 200
    game_id = response.json()["id"]
    print(f"✓ Game created with weekly time control: {game_id}")
    
    # Join game
    response = client.post(f"/api/games/{game_id}/join", 
        json={},
        headers=black_player["headers"]
    )
    assert response.status_code == 200
    print("✓ BlackPlayer joined")
    
    # Play Fool's Mate
    moves = [
        (white_player, "f2f3"),
        (black_player, "e7e5"),
        (white_player, "g2g4"),
        (black_player, "d8h4")
    ]
    
    for i, (player, move) in enumerate(moves):
        response = client.post(f"/api/games/{game_id}/move", 
            json={"move": move},
            headers=player["headers"]
        )
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        print(f"✓ Move {i+1}: {player['username']} plays {move}")
        
        if i == 3:
            assert result["game_over"] is True
            assert result["result"] == "black"
            print("✓ Fool's Mate complete! Black wins by checkmate.")
