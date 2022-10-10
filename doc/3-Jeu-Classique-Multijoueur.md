# Deroulement de Partie

```plantuml
@startuml
state "debut de partie" as db
state "Tour Joueur X" as tour
state "Passe son tour" as pp
state "Placer Mot" as pm
state "Piger Lettres" as pl
state "Fin de tour" as fin
state "Fin de Partie?" as fp <<choice>>
state "Partie Finie" as pf
[*] --> db
db --> tour
tour --> pp
tour --> pm
tour --> pl
pp --> fin
pm --> fin
pl --> fin
fin --> fp
fp --> pf : Oui
fp --> tour : Non
@enduml
```

# Joindre Partie

```plantuml
@startuml
state "Liste de parties" as lp
state "En attente de confirmation" as ac
state "Confirmation" as c <<choice>>
state "Debuter Partie" as dp
lp --> ac
ac --> c
c --> lp : Rejete
c --> dp : Accepte
@enduml
```

# Classes pour une partie de Scrabble Classique

```plantuml
class Joueur{
	string Nom
	char[7] Chevalet
	int Score
	+Jouer()
	-Piger()
	-PlacerMot()
	-PasserSonTour()
}
class PartieMultijoueur{
	Joueur[2] Joueurs
	Plateau Plateau
	int JoueurActif
	+EffectuerTour()
	-VerifierFin()
}
@enduml
```
