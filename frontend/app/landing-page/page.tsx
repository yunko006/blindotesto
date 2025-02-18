"use client"
import { Music, Play, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex flex-col items-center justify-center p-4">
      {/* Logo Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Music className="w-12 h-12 text-white" />
          <h1 className="text-4xl font-bold text-white ml-2">BlindParty</h1>
        </div>
        <p className="text-purple-200">Le blind test entre amis</p>
      </div>

      {/* Main Actions */}
      <div className="w-full max-w-md space-y-4">
        <Button variant="default" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6">
          <Play className="w-6 h-6 mr-2" />
          Se connecter avec Spotify
        </Button>

        <Button variant="default" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6">
          <Users className="w-6 h-6 mr-2" />
          Créer une partie
        </Button>

        <div className="relative">
          <Input
            type="text"
            placeholder="Code de la partie"
            className="w-full px-6 py-6 bg-white bg-opacity-10 text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500"
          />
          <Button
            variant="default"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 hover:bg-purple-600 text-white"
          >
            Rejoindre
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-purple-300 text-sm">Spotify Premium requis pour l'hôte</div>
    </div>
  )
}

export default LandingPage

