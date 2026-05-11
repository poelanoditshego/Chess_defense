import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

function App() {
  const [game, setGame] = useState(new Chess());
  const [lastMove, setLastMove] = useState("");
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMoveSquares, setLastMoveSquares] = useState({});
  const [moveObjects, setMoveObjects] = useState([]);
  const [capturedWhitePieces, setCapturedWhitePieces] = useState([]);
  const [capturedBlackPieces, setCapturedBlackPieces] = useState([]);
  const [gameStatus, setGameStatus] = useState("");
  const [bestMoveSquares, setBestMoveSquares] = useState({});

  const [bestMove, setBestMove] = useState("");
  const engineRef = useRef(null);

  function getPieceSymbol(piece, color) {
    const symbols = {
      w: {
        p: "♙",
        n: "♘",
        b: "♗",
        r: "♖",
        q: "♕",
        k: "♔",
      },
      b: {
        p: "♟",
        n: "♞",
        b: "♝",
        r: "♜",
        q: "♛",
        k: "♚",
      },
    };

    return symbols[color][piece];
  }

  useEffect(() => {
    engineRef.current = new Worker("/stockfish.js");

    engineRef.current.onmessage = (event) => {
      const line = event.data;
      console.log("Stockfish:", line);

      if (line.startsWith("bestmove")) {
        const move = line.split(" ")[1];

        setBestMove(move);

        const from = move.slice(0, 2);
        const to = move.slice(2, 4);

        setBestMoveSquares({
          [from]: {
            boxShadow: "inset 0 0 0 4px lime",
          },
          [to]: {
            boxShadow: "inset 0 0 0 4px lime",
          },
        });
      }
    };

    return () => {
      engineRef.current?.terminate();
    };
  }, []);

  function onPieceDrop({ sourceSquare, targetSquare }) {
    console.log("Dropped:", sourceSquare, targetSquare);

    const gameCopy = new Chess(game.fen());

    let move = null;

    try {
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
    } catch (error) {
      console.log("Invalid move");
      return false;
    }

    if (!move) return false;

    setGame(gameCopy);
    setLastMove(move.san);
    setMoveHistory((prev) => [...prev, move.san]);
    setMoveObjects((prev) => [...prev, move]);

    if (move.captured) {
      const capturedColor = move.color === "w" ? "b" : "w";
      const capturedPiece = getPieceSymbol(move.captured, capturedColor);

      if (capturedColor === "w") {
        setCapturedWhitePieces((prev) => [...prev, capturedPiece]);
      } else {
        setCapturedBlackPieces((prev) => [...prev, capturedPiece]);
      }
    }

    setLastMoveSquares({
      [move.from]: {
        boxShadow: "inset 0 0 0 4px yellow",
      },
      [move.to]: {
        boxShadow: "inset 0 0 0 4px yellow",
      },
    });

    engineRef.current.postMessage("position fen " + gameCopy.fen());
    engineRef.current.postMessage("go depth 12");

    if (gameCopy.isCheckmate()) {
      setGameStatus("Checkmate! Game over.");
    } else if (gameCopy.isCheck()) {
      setGameStatus("Check!");
    } else if (gameCopy.isDraw()) {
      setGameStatus("Draw!");
    } else {
      setGameStatus("");
    }

    return true;
  }

  function resetGame() {
    setGame(new Chess());
    setLastMove("");
    setMoveHistory([]);
    setLastMoveSquares({});
    setMoveObjects([]);
    setCapturedWhitePieces([]);
    setCapturedBlackPieces([]);
    setGameStatus("");
    setBestMoveSquares({});
    setBestMove("");
  }

  function undoMove() {
    if (moveObjects.length === 0) return;

    const newMoveObjects = moveObjects.slice(0, -1);
    const gameCopy = new Chess();

    newMoveObjects.forEach((move) => {
      gameCopy.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || "q",
      });
    });

    setGame(gameCopy);
    setMoveObjects(newMoveObjects);

    const newHistory = gameCopy.history();
    setMoveHistory(newHistory);
    setLastMove(newHistory[newHistory.length - 1] || "");

    const previousMove = gameCopy.history({ verbose: true }).slice(-1)[0];

    if (previousMove) {
      setLastMoveSquares({
        [previousMove.from]: {
          boxShadow: "inset 0 0 0 4px yellow",
        },
        [previousMove.to]: {
          boxShadow: "inset 0 0 0 4px yellow",
        },
      });
    } else {
      setLastMoveSquares({});
    }
  }

  const options = {
    position: game.fen(),
    onPieceDrop,
    squareStyles: {
      ...lastMoveSquares,
      ...bestMoveSquares,
    },
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "30px",
        marginTop: "40px",
        alignItems: "flex-start",
      }}
    >
      <div style={{ width: "500px" }}>
        <h1>Chess Defense AI</h1>

        <p>Last move: {lastMove || "No moves yet"}</p>

        <p>Current turn: {game.turn() === "w" ? "White" : "Black"}</p>

        <p>Stockfish suggestion: {bestMove || "Make a move first"}</p>

        {gameStatus && (
          <h2 style={{ color: "red" }}>
            {gameStatus}
          </h2>
        )}

        <button onClick={resetGame}>Reset Game</button>
        <button onClick={undoMove}>Undo Move</button>

        <div style={{ marginTop: "20px" }}>
          <Chessboard options={options} />
        </div>
      </div>

      <div
        style={{
          width: "200px",
          border: "1px solid gray",
          padding: "10px",
          borderRadius: "8px",
        }}
      >

        <h3>Captured Pieces</h3>

        <p>White captured:</p>
        <div style={{ fontSize: "24px" }}>
          {capturedBlackPieces.join(" ")}
        </div>

        <p>Black captured:</p>
        <div style={{ fontSize: "24px" }}>
          {capturedWhitePieces.join(" ")}
        </div>


        <h3>Move History</h3>

        <ul>
          {moveHistory.map((move, index) => (
            <li key={index}>
              {index + 1}. {move}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;