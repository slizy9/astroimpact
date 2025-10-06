import { render, screen, fireEvent } from '@testing-library/react';
import EnhancedMiniGameV2 from '../components/EnhancedMiniGameV2';

describe('Game integration', () => {
  test('renders canvas and fires missile on click', () => {
    render(<EnhancedMiniGameV2 />);
    const canvas = screen.getByTestId('game-canvas');
    expect(canvas).toBeInTheDocument();
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    // No crash -> pass; optionally we could spy on engine, but this checks integration renders
  });
});


