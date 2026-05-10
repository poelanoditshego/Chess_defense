import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

function App() {
  const [game, setGame] = useState(new Chess());
  const [lastMove, setLastMove] = useState("");

  function onPieceDrop({ sourceSquare, targetSquare }) {
    console.log("Dropped:", sourceSquare, targetSquare);

    const gameCopy = new Chess(game.fen());

    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (!move) return false;

    setGame(gameCopy);
    setLastMove(move.san);

    return true;
  }

  const options = {
    position: game.fen(),
    onPieceDrop,
  };

  return (
    <div style={{ width: "500px", margin: "40px auto" }}>
      <h1>Chess Defense AI</h1>
      <p>Last move: {lastMove || "No moves yet"}</p>

      <Chessboard options={options} />
    </div>
  );
}

export default App;