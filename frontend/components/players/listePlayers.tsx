// components/players/listePlayers.tsx
import React from "react";

interface Player {
  id: number | string; // Permettre des id de type string ou number
  name: string;
}

interface PlayersComponentProps {
  players: Player[];
}

const PlayersComponent: React.FC<PlayersComponentProps> = ({ players }) => {
  // Division en colonnes (gauche et droite)
  const leftColumn: Player[] = [];
  const rightColumn: Player[] = [];

  players.forEach((player, index) => {
    if (index % 2 === 0) {
      leftColumn.push(player);
    } else {
      rightColumn.push(player);
    }
  });

  // Calculer le nombre maximum de lignes
  const maxRows = Math.max(leftColumn.length, rightColumn.length);

  // Si aucun joueur, afficher un message
  if (players.length === 0) {
    return (
      <div className="py-3 text-center text-gray-500">
        Aucun joueur connecté
      </div>
    );
  }

  return (
    <table className="w-full border-collapse">
      <tbody>
        {Array.from({ length: maxRows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            <td
              className={`py-3 px-2 text-center ${
                rowIndex < maxRows - 1 ? "border-b border-gray-300" : ""
              }`}
            >
              {leftColumn[rowIndex] && (
                <div className="flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  {leftColumn[rowIndex].name}
                </div>
              )}
            </td>
            <td
              className={`py-3 px-2 text-center border-l border-gray-300 ${
                rowIndex < maxRows - 1 ? "border-b border-gray-300" : ""
              }`}
            >
              {rightColumn[rowIndex] && (
                <div className="flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  {rightColumn[rowIndex].name}
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PlayersComponent;
