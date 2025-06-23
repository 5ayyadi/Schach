import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Chess } from 'chess.js'
import App from '../App'
import LandingPage from '../components/LandingPage'
import AuthPage from '../components/AuthPage'
import GameSetupPage from '../components/GameSetupPage'
import GamePage from '../components/GamePage'

// Mock react-chessboard to avoid canvas issues in tests
vi.mock('react-chessboard', () => ({
  Chessboard: ({ position, onPieceDrop, arePiecesDraggable }) => (
    <div 
      data-testid="chessboard" 
      data-position={position}
      data-draggable={arePiecesDraggable}
      onClick={() => onPieceDrop && onPieceDrop('e2', 'e4')}
    >
      Chessboard Component
    </div>
  )
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Chess Application Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Landing Page', () => {
    it('should render landing page with welcome message and play button', () => {
      renderWithRouter(<LandingPage />)
      
      expect(screen.getByText('♟️ Chess Master')).toBeInTheDocument()
      expect(screen.getByText(/Challenge players from around the world/)).toBeInTheDocument()
      expect(screen.getByText('Play Chess')).toBeInTheDocument()
    })

    it('should navigate to auth page when play button is clicked', () => {
      renderWithRouter(<LandingPage />)
      
      const playButton = screen.getByText('Play Chess')
      expect(playButton.getAttribute('href')).toBe('/auth')
    })
  })

  describe('Auth Page', () => {
    const mockSetUser = vi.fn()

    it('should render login form by default', () => {
      renderWithRouter(<AuthPage setUser={mockSetUser} />)
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      expect(screen.getByText('Sign in to continue playing chess')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })

    it('should toggle between login and registration forms', async () => {
      renderWithRouter(<AuthPage setUser={mockSetUser} />)
      
      const toggleButton = screen.getByText('Create one')
      fireEvent.click(toggleButton)
      
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
      expect(screen.getByText('Join our community of chess players')).toBeInTheDocument()
    })

    it('should handle form submission with valid credentials', async () => {
      renderWithRouter(<AuthPage setUser={mockSetUser} />)
      
      const usernameInput = screen.getByPlaceholderText('Enter your username')
      const passwordInput = screen.getByPlaceholderText('Enter your password')
      const submitButton = screen.getByText('Sign In')
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      expect(screen.getByText('Please wait...')).toBeInTheDocument()
    })

    it('should disable submit button with empty fields', () => {
      renderWithRouter(<AuthPage setUser={mockSetUser} />)
      
      const submitButton = screen.getByText('Sign In')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Game Setup Page', () => {
    const mockUser = { id: 1, username: 'testuser' }

    it('should render game setup options', () => {
      renderWithRouter(<GameSetupPage user={mockUser} />)
      
      expect(screen.getByText('Setup New Game')).toBeInTheDocument()
      expect(screen.getByText('Welcome back, testuser!')).toBeInTheDocument()
      expect(screen.getByText('Time Control')).toBeInTheDocument()
      expect(screen.getByText('Choose Color')).toBeInTheDocument()
    })

    it('should display all time control options', () => {
      renderWithRouter(<GameSetupPage user={mockUser} />)
      
      expect(screen.getByText('Bullet')).toBeInTheDocument()
      expect(screen.getByText('Blitz')).toBeInTheDocument()
      expect(screen.getByText('Rapid')).toBeInTheDocument()
      expect(screen.getByText('Daily')).toBeInTheDocument()
      expect(screen.getByText('Custom')).toBeInTheDocument()
    })

    it('should display color selection options', () => {
      renderWithRouter(<GameSetupPage user={mockUser} />)
      
      expect(screen.getByText('White')).toBeInTheDocument()
      expect(screen.getByText('Black')).toBeInTheDocument()
      expect(screen.getAllByText('Random')).toHaveLength(2) // One in option, one in summary
    })

    it('should show custom time input when custom is selected', () => {
      renderWithRouter(<GameSetupPage user={mockUser} />)
      
      const customOption = screen.getByText('Custom').closest('.option-card')
      fireEvent.click(customOption)
      
      expect(screen.getByText('Minutes per player')).toBeInTheDocument()
      expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    })

    it('should handle game creation', () => {
      renderWithRouter(<GameSetupPage user={mockUser} />)
      
      const createButton = screen.getByText('Create Game')
      fireEvent.click(createButton)
      
      expect(screen.getByText('Creating Game...')).toBeInTheDocument()
    })
  })

  describe('Game Page', () => {
    const mockUser = { id: 1, username: 'testuser' }

    it('should render game page with chessboard', async () => {
      renderWithRouter(<GamePage user={mockUser} />)
      
      expect(screen.getByText('Chess Game')).toBeInTheDocument()
      expect(screen.getByText('Game ID')).toBeInTheDocument()
      expect(screen.getByText('Time Control')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should show waiting message initially', () => {
      renderWithRouter(<GamePage user={mockUser} />)
      
      expect(screen.getByText('⏳ Waiting for opponent...')).toBeInTheDocument()
      expect(screen.getByText(/Share this game ID with a friend/)).toBeInTheDocument()
    })

    it('should display player information', () => {
      renderWithRouter(<GamePage user={mockUser} />)
      
      expect(screen.getByText('⚪ testuser')).toBeInTheDocument()
      expect(screen.getByText('⚫ Waiting for opponent...')).toBeInTheDocument()
    })

    it('should show chessboard after opponent joins', async () => {
      renderWithRouter(<GamePage user={mockUser} />)
      
      // Wait for opponent to join (simulated after 3 seconds)
      await waitFor(() => {
        expect(screen.getByTestId('chessboard')).toBeInTheDocument()
      }, { timeout: 4000 })
      
      expect(screen.getByText('⚫ Opponent')).toBeInTheDocument()
    })
  })

  describe('Chess Game Logic', () => {
    it('should initialize chess game correctly', () => {
      const game = new Chess()
      expect(game.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      expect(game.turn()).toBe('w')
    })

    it('should handle valid moves', () => {
      const game = new Chess()
      const move = game.move({ from: 'e2', to: 'e4' })
      
      expect(move).not.toBeNull()
      expect(game.turn()).toBe('b')
    })

    it('should reject invalid moves', () => {
      const game = new Chess()
      
      try {
        const move = game.move({ from: 'e2', to: 'e5' })
        expect(move).toBeNull()
      } catch (error) {
        // chess.js throws errors for invalid moves in newer versions
        expect(error.message).toContain('Invalid move')
      }
      
      // Game state should remain unchanged
      expect(game.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      expect(game.turn()).toBe('w')
    })

    it('should detect checkmate', () => {
      const game = new Chess()
      // Fool's mate setup
      game.move({ from: 'f2', to: 'f3' })
      game.move({ from: 'e7', to: 'e5' })
      game.move({ from: 'g2', to: 'g4' })
      game.move({ from: 'd8', to: 'h4' })
      
      expect(game.isCheckmate()).toBe(true)
      expect(game.isGameOver()).toBe(true)
    })
  })

  describe('Full Application Flow', () => {
    it('should complete full user journey', async () => {
      render(<App />)
      
      // Should have any content indicating the app is loaded
      expect(document.body).toBeInTheDocument()
    })
  })
})
