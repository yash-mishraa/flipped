import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LetterGrid } from "@/features/game/components/LetterGrid";
import { createInitialGrid, enterLetter } from "@/features/game/domain/letter-grid";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";

describe("LetterGrid Component", () => {
  const fastFoodPuzzle = TEST_PUZZLES[0]!; // FAST (4) FOOD (4)

  it("renders two separate word groups with correct tile counts", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    render(
      <LetterGrid
        grid={grid}
        selectedPosition={{ wordIndex: 0, letterIndex: 1 }}
        isRoundOver={false}
        onSelectTile={vi.fn()}
        onInputLetter={vi.fn()}
        onClearTile={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const wordGroup0 = screen.getByTestId("word-group-0");
    const wordGroup1 = screen.getByTestId("word-group-1");

    expect(wordGroup0).toBeInTheDocument();
    expect(wordGroup1).toBeInTheDocument();

    // 4 tiles in word 0, 4 tiles in word 1
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`tile-0-${i}`)).toBeInTheDocument();
      expect(screen.getByTestId(`tile-1-${i}`)).toBeInTheDocument();
    }
  });

  it("renders fixed clue letters as disabled with lock indicator", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    render(
      <LetterGrid
        grid={grid}
        selectedPosition={{ wordIndex: 0, letterIndex: 1 }}
        isRoundOver={false}
        onSelectTile={vi.fn()}
        onInputLetter={vi.fn()}
        onClearTile={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const fixedTile0 = screen.getByTestId("tile-0-0");
    const fixedTile1 = screen.getByTestId("tile-1-0");

    expect(fixedTile0).toBeDisabled();
    expect(fixedTile1).toBeDisabled();
    expect(fixedTile0).toHaveTextContent("F");
    expect(fixedTile1).toHaveTextContent("F");
    expect(fixedTile0).toHaveAttribute("data-fixed", "true");
  });

  it("calls onSelectTile when clicking an editable tile", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    const onSelectTile = vi.fn();

    render(
      <LetterGrid
        grid={grid}
        selectedPosition={{ wordIndex: 0, letterIndex: 1 }}
        isRoundOver={false}
        onSelectTile={onSelectTile}
        onInputLetter={vi.fn()}
        onClearTile={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const editableTile = screen.getByTestId("tile-0-1");
    fireEvent.click(editableTile);

    expect(onSelectTile).toHaveBeenCalledWith({ wordIndex: 0, letterIndex: 1 });
  });

  it("does not trigger onSelectTile when clicking a fixed tile", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    const onSelectTile = vi.fn();

    render(
      <LetterGrid
        grid={grid}
        selectedPosition={{ wordIndex: 0, letterIndex: 1 }}
        isRoundOver={false}
        onSelectTile={onSelectTile}
        onInputLetter={vi.fn()}
        onClearTile={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const fixedTile = screen.getByTestId("tile-0-0");
    fireEvent.click(fixedTile);

    expect(onSelectTile).not.toHaveBeenCalled();
  });

  it("dispatches letter inputs through hidden capture input on keydown", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    const onInputLetter = vi.fn();

    render(
      <LetterGrid
        grid={grid}
        selectedPosition={{ wordIndex: 0, letterIndex: 1 }}
        isRoundOver={false}
        onSelectTile={vi.fn()}
        onInputLetter={onInputLetter}
        onClearTile={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const input = screen.getByLabelText("Letter input for active tile");

    // Type 'A'
    fireEvent.keyDown(input, { key: "a" });
    expect(onInputLetter).toHaveBeenCalledWith("A");

    // Non-alphabetical character is ignored
    fireEvent.keyDown(input, { key: "1" });
    expect(onInputLetter).not.toHaveBeenCalledWith("1");
  });

  it("dispatches navigation and clearing keys properly", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    const onClearTile = vi.fn();
    const onNavigate = vi.fn();

    render(
      <LetterGrid
        grid={grid}
        selectedPosition={{ wordIndex: 0, letterIndex: 1 }}
        isRoundOver={false}
        onSelectTile={vi.fn()}
        onInputLetter={vi.fn()}
        onClearTile={onClearTile}
        onNavigate={onNavigate}
      />
    );

    const input = screen.getByLabelText("Letter input for active tile");

    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onClearTile).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(input, { key: "Delete" });
    expect(onClearTile).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(input, { key: "ArrowLeft" });
    expect(onNavigate).toHaveBeenCalledWith("left");

    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(onNavigate).toHaveBeenCalledWith("right");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(onNavigate).toHaveBeenCalledWith("up");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(onNavigate).toHaveBeenCalledWith("down");

    fireEvent.keyDown(input, { key: "Home" });
    expect(onNavigate).toHaveBeenCalledWith("home");

    fireEvent.keyDown(input, { key: "End" });
    expect(onNavigate).toHaveBeenCalledWith("end");
  });

  it("renders distinct multi-modal visual feedback states correctly", () => {
    let grid = createInitialGrid(fastFoodPuzzle);
    // Enter correct 'A' at pos 1 -> CONFIRMED
    grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "A");
    // Enter wrong 'Z' at pos 2 -> ELIMINATED
    grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 2 }, "Z");
    // Enter misplaced 'T' at pos 3 of word 1 (target is FOOD, T not in FOOD) -> ELIMINATED
    // Enter misplaced 'O' at pos 3 of word 0 (target is FAST, O not in FAST)
    // For Word 0, target is FAST. Pos 3 is 'T'. Enter 'S' at pos 3 -> S is in FAST! -> PENDING
    grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 3 }, "S");

    render(
      <LetterGrid
        grid={grid}
        selectedPosition={{ wordIndex: 0, letterIndex: 1 }}
        isRoundOver={false}
        onSelectTile={vi.fn()}
        onInputLetter={vi.fn()}
        onClearTile={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const tileA = screen.getByTestId("tile-0-1");
    expect(tileA).toHaveAttribute("data-feedback", "CONFIRMED");

    const tileZ = screen.getByTestId("tile-0-2");
    expect(tileZ).toHaveAttribute("data-feedback", "ELIMINATED");

    const tileS = screen.getByTestId("tile-0-3");
    expect(tileS).toHaveAttribute("data-feedback", "PENDING");
  });

  it("disables all tiles and hidden input when isRoundOver is true", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    render(
      <LetterGrid
        grid={grid}
        selectedPosition={null}
        isRoundOver={true}
        onSelectTile={vi.fn()}
        onInputLetter={vi.fn()}
        onClearTile={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    for (let w = 0; w < 2; w++) {
      for (let i = 0; i < 4; i++) {
        expect(screen.getByTestId(`tile-${w}-${i}`)).toBeDisabled();
      }
    }

    const input = screen.getByLabelText("Letter input for active tile");
    expect(input).toBeDisabled();
  });
});
