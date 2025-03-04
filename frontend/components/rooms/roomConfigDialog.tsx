// components/rooms/roomConfigDialog.tsx
import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoomConfig {
  roomName: string;
  password: string;
  playlist: string;
  clipDuration: string;
  clipMoment: string;
  buzzerOffDuration: string;
  cutMusicAfterBuzz: boolean;
}

interface RoomConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config: RoomConfig;
  onConfigChange: (config: RoomConfig) => void;
}

const RoomConfigDialog: React.FC<RoomConfigDialogProps> = ({
  isOpen,
  onOpenChange,
  config,
  onConfigChange,
}) => {
  const [editedConfig, setEditedConfig] = useState<RoomConfig>({ ...config });

  // Mettre à jour les valeurs éditées quand la config change ou quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen) {
      // Extraire juste le nombre des chaînes potentiellement formatées
      const clipDurationValue =
        parseInt(config.clipDuration.toString().replace(/\D/g, "")) || 15;
      const buzzerOffValue =
        parseInt(config.buzzerOffDuration.toString().replace(/\D/g, "")) || 3;

      // Arrondir la durée d'extrait au multiple de 5 le plus proche
      const roundedClipDuration = Math.round(clipDurationValue / 5) * 5;
      const clipValue = Math.min(Math.max(roundedClipDuration, 5), 20);

      // Assurer que la durée buzzer est entre 1 et 3
      const buzzerValue = Math.min(Math.max(buzzerOffValue, 1), 3);

      setEditedConfig(() => ({
        ...config, // Utiliser toutes les valeurs récentes de la config
        clipDuration: `${clipValue} sec`,
        buzzerOffDuration: `${buzzerValue} sec`,
      }));
    }
  }, [isOpen, config]);

  const handleSaveConfig = () => {
    // Format les valeurs correctement avant de les envoyer au parent
    const formattedConfig = {
      ...editedConfig,
      // Assurez-vous que les valeurs numériques sont bien formatées
      clipDuration: editedConfig.clipDuration.includes("sec")
        ? editedConfig.clipDuration
        : `${editedConfig.clipDuration} sec`,
      buzzerOffDuration: editedConfig.buzzerOffDuration.includes("sec")
        ? editedConfig.buzzerOffDuration
        : `${editedConfig.buzzerOffDuration} sec`,
    };

    // Envoyer les données au composant parent
    onConfigChange(formattedConfig);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Création d&apos;une partie
          </DialogTitle>
        </DialogHeader>
        <div className="border-2 border-black rounded-lg p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="font-medium">Playlist</div>
              <div>
                <select
                  className="border-b border-black bg-transparent focus:outline-none"
                  value={editedConfig.playlist}
                  onChange={(e) =>
                    setEditedConfig({
                      ...editedConfig,
                      playlist: e.target.value,
                    })
                  }
                >
                  <option value="pop">Pop</option>
                  <option value="rock">Rock</option>
                  <option value="hiphop">Hip-hop</option>
                  <option value="electro">Électro</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">durée des extraits</div>
                <div className="font-medium">{editedConfig.clipDuration}</div>
              </div>
              <Slider
                defaultValue={[parseInt(editedConfig.clipDuration)]}
                max={20}
                min={5}
                step={5}
                onValueChange={(value) =>
                  setEditedConfig({
                    ...editedConfig,
                    clipDuration: `${value[0]} sec`,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="font-medium">moment des extraits</div>
              <select
                className="border-b border-black bg-transparent focus:outline-none"
                value={editedConfig.clipMoment}
                onChange={(e) =>
                  setEditedConfig({
                    ...editedConfig,
                    clipMoment: e.target.value,
                  })
                }
              >
                <option value="opening">opening</option>
                <option value="refrain">refrain</option>
                <option value="ending">ending</option>
                <option value="random">aléatoire</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  durée buzzer off après buzz raté
                </div>
                <div className="font-medium">
                  {editedConfig.buzzerOffDuration}
                </div>
              </div>
              <Slider
                defaultValue={[parseInt(editedConfig.buzzerOffDuration)]}
                max={3}
                min={1}
                step={1}
                onValueChange={(value) =>
                  setEditedConfig({
                    ...editedConfig,
                    buzzerOffDuration: `${value[0]} sec`,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="font-medium">couper la musique après un buzz</div>
              <div className="flex items-center space-x-2">
                <span>{editedConfig.cutMusicAfterBuzz ? "on" : "off"}</span>
                <Switch
                  checked={editedConfig.cutMusicAfterBuzz}
                  onCheckedChange={(checked) =>
                    setEditedConfig({
                      ...editedConfig,
                      cutMusicAfterBuzz: checked,
                    })
                  }
                />
              </div>
            </div>

            <button
              className="w-full text-center border-2 border-black rounded-md py-2 px-4 font-bold hover:bg-gray-100 transition-colors"
              onClick={handleSaveConfig}
            >
              Sauvegarder les options
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomConfigDialog;
