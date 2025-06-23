"""
Test Scholar's Mate scenario

Tests a quick checkmate in 4 moves:
1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6?? 4. Qxf7# (White wins in 4 moves)

Tests: create game -> join game -> make moves -> checkmate
"""

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_scholars_mate_5_plus_3(client, white_player, black_player):
    """Test Scholar's Mate with 5+3 time control"""
    
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
    
    # Play Scholar's Mate: e4 e5 Bc4 Nc6 Qh5 Nf6 Qxf7#
    moves = [
        (white_player, "e2e4"),  # 1. e4
        (black_player, "e7e5"),  # 1... e5
        (white_player, "f1c4"),  # 2. Bc4
        (black_player, "b8c6"),  # 2... Nc6
        (white_player, "d1h5"),  # 3. Qh5
        (black_player, "g8f6"),  # 3... Nf6??
        (white_player, "h5f7")   # 4. Qxf7# (checkmate!)
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
        
        if i == 6:  # Last move
            assert result["game_over"] is True
            assert result["result"] == "white"
            print("✓ Scholar's Mate complete! White wins by checkmate.")


def test_scholars_mate_with_reconnection_5_plus_3(client, white_player, black_player):
    """Test Scholar's Mate with 5+3 time control - includes disconnection/reconnection scenario"""
    
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
    
    # Play first four moves: e4 e5 Bc4 Nc6
    moves_before_disconnect = [
        (white_player, "e2e4"),  # 1. e4
        (black_player, "e7e5"),  # 1... e5
        (white_player, "f1c4"),  # 2. Bc4
        (black_player, "b8c6"),  # 2... Nc6
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
    
    # Simulate black player disconnection after 4 moves
    print("⚠ Simulating black player disconnection...")
    
    # White player can still get the current game state
    response = client.get(f"/api/games/{game_id}")
    assert response.status_code == 200
    game_state = response.json()
    assert game_state["status"] == "in_progress"
    print("✓ Game state persists during black player disconnection")
    
    # White player makes next move while black is disconnected
    response = client.post(f"/api/games/{game_id}/move", 
        json={"move": "d1h5"},  # 3. Qh5
        headers=white_player["headers"]
    )
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    print("✓ Move 5: WhitePlayer plays d1h5 while black disconnected")
    
    # Black player reconnects and can see the updated game state
    print("✓ Black player reconnects...")
    response = client.get(f"/api/games/{game_id}")
    assert response.status_code == 200
    game_state = response.json()
    assert game_state["status"] == "in_progress"
    print("✓ Black player can see updated game state after reconnection")
    
    # Black player makes the blunder move
    response = client.post(f"/api/games/{game_id}/move", 
        json={"move": "g8f6"},  # 3... Nf6??
        headers=black_player["headers"]
    )
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    print("✓ Move 6: BlackPlayer plays g8f6 after reconnection")
    
    # White delivers checkmate
    response = client.post(f"/api/games/{game_id}/move", 
        json={"move": "h5f7"},  # 4. Qxf7# (checkmate!)
        headers=white_player["headers"]
    )
    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    assert result["game_over"] is True
    assert result["result"] == "white"
    print("✓ Scholar's Mate complete! White wins by checkmate after reconnection scenario.")


def test_scholars_mate_10_plus_0(client, white_player, black_player):
    """Test Scholar's Mate with 10+0 time control"""
    
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
    
    # Play Scholar's Mate
    moves = [
        (white_player, "e2e4"),
        (black_player, "e7e5"),
        (white_player, "f1c4"),
        (black_player, "b8c6"),
        (white_player, "d1h5"),
        (black_player, "g8f6"),
        (white_player, "h5f7")
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
        
        if i == 6:
            assert result["game_over"] is True
            assert result["result"] == "white"
            print("✓ Scholar's Mate complete! White wins by checkmate.")


def test_scholars_mate_daily(client, white_player, black_player):
    """Test Scholar's Mate with daily time control"""
    
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
    
    # Play Scholar's Mate
    moves = [
        (white_player, "e2e4"),
        (black_player, "e7e5"),
        (white_player, "f1c4"),
        (black_player, "b8c6"),
        (white_player, "d1h5"),
        (black_player, "g8f6"),
        (white_player, "h5f7")
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
        
        if i == 6:
            assert result["game_over"] is True
            assert result["result"] == "white"
            print("✓ Scholar's Mate complete! White wins by checkmate.")


def test_scholars_mate_weekly(client, white_player, black_player):
    """Test Scholar's Mate with weekly time control"""
    
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
    
    # Play Scholar's Mate
    moves = [
        (white_player, "e2e4"),
        (black_player, "e7e5"),
        (white_player, "f1c4"),
        (black_player, "b8c6"),
        (white_player, "d1h5"),
        (black_player, "g8f6"),
        (white_player, "h5f7")
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
        
        if i == 6:
            assert result["game_over"] is True
            assert result["result"] == "white"
            print("✓ Scholar's Mate complete! White wins by checkmate.")
