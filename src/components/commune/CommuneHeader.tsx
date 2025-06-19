interface CommuneHeaderProps {
  codeInsee: string
  currentCommune: any
  onReturnHome: () => void
}

// Fonction pour formater les nombres sans abréviation (3300 au lieu de 3.3k)
function formatNumberFull(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num)
}

export default function CommuneHeader({ 
  codeInsee, 
  currentCommune, 
  onReturnHome 
}: CommuneHeaderProps) {
  return (
    <div className="flex flex-row items-stretch gap-4 xl:flex-1">
      {/* Bouton retour à l'accueil */}
      <div className="modern-card shadow-xl">
        <button 
          onClick={onReturnHome}
          className="p-3 text-center min-w-[80px] lg:min-w-[120px] hover:bg-white/10 transition-colors rounded-lg"
          title="Retour à l'accueil"
        >
          <div className="text-2xl lg:text-3xl font-bold text-gradient mb-1">
            ← 
          </div>
          <div className="nav-button-label text-xs lg:text-sm">
            Retour à l'accueil
          </div>
        </button>
      </div>
      
      {/* Nom de la commune et code INSEE - centré sur mobile, aligné à gauche sur desktop */}
      <div className="modern-card shadow-xl flex-1">
        <div className="p-3 text-center xl:text-left">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">
            <span className="text-gradient">{currentCommune.nom || `Commune ${codeInsee}`}</span>
          </h1>
          <p className="species-count-title text-sm lg:text-base">
            INSEE : <span className="text-gradient">{codeInsee}</span>
          </p>
        </div>
      </div>
    </div>
  )
} 