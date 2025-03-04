// components/rooms/roomConfig.tsx
import React, { useState } from "react";
import RoomConfigDialog from "./roomConfigDialog";

interface RoomConfig {
  roomName: string;
  password: string;
  playlist: string;
  clipDuration: string;
  clipMoment: string;
  buzzerOffDuration: string;
  cutMusicAfterBuzz: boolean;
}

interface RoomConfigComponentProps {
  config: RoomConfig;
  onConfigChange?: (config: RoomConfig) => void;
}

const RoomConfigComponent: React.FC<RoomConfigComponentProps> = ({
  config,
  onConfigChange,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConfigChange = (newConfig: RoomConfig) => {
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">playlist</div>
        <div className="font-medium">{config.playlist}</div>
      </div>
      <div className="flex items-center justify-between">
        <div className="font-medium">durée des extraits</div>
        <div className="font-medium">{config.clipDuration}</div>
      </div>
      <div className="flex items-center justify-between">
        <div className="font-medium">moment des extraits</div>
        <div className="font-medium">{config.clipMoment}</div>
      </div>
      <div className="flex items-center justify-between">
        <div className="font-medium">durée buzzer off après buzz raté</div>
        <div className="font-medium">{config.buzzerOffDuration}</div>
      </div>
      <div className="flex items-center justify-between">
        <div className="font-medium">couper la musique après buzz</div>
        <div className="font-medium">
          {config.cutMusicAfterBuzz ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-check"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-x"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          )}
        </div>
      </div>
      <div className="mt-8">
        <button
          className="w-full text-center border-2 border-black rounded-md py-2 px-4 font-bold hover:bg-gray-100 transition-colors"
          onClick={() => setIsDialogOpen(true)}
        >
          Changer les reglès
        </button>
      </div>

      {/* Dialog pour modifier la configuration */}
      <RoomConfigDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        config={config}
        onConfigChange={handleConfigChange}
      />
    </div>
  );
};

export default RoomConfigComponent;
