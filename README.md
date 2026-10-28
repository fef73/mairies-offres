# Fiches climat pour les communes — page de proposition

Page de présentation et d'offre des **fiches climat communales** : une fiche A4 par commune, calculée à l'altitude choisie, avec les normales, l'écart de l'année, les extrêmes et l'évolution depuis 1950.

Page : https://fef73.github.io/mairies-offres/

Générateur de la fiche : [mairies-pdf](https://fef73.github.io/mairies-pdf/) — usage interne.

## Contenu de la page

- **Pourquoi une fiche climat** : bulletin municipal, adaptation et PCAET, altitude juste en montagne, accueil touristique, écoles.
- **Ce que contient la fiche** : climat mois par mois (normales 1991–2020), chiffres clés, année en cours face à la normale, bande de couleurs depuis 1950, jours chauds, de gel, de forte pluie et de neige, extrêmes, repères locaux, option « Quand venir ».
- **Pour qui** : mairies, intercommunalités, offices de tourisme, parcs, syndicats et stations.
- **Fiches en option** (+ 80 € HT chacune, 2 pages A4) : *Fiche neige · 20 saisons*, *Fiche qualité de l'air* (niveau de pollution face à l'OMS et aux limites UE 2030, PM2,5, PM10, NO₂, ozone, bandes de pollution jour par jour ; générée avec [qualite-air](https://fef73.github.io/qualite-air/)) et *Fiche réchauffement climatique* (niveau de réchauffement face à 1951-1980, bandes climatiques depuis 1940, le même jour comparé année par année ; générée avec [meteo-climat](https://fef73.github.io/meteo-climat/)).
- **Formules** : fiche PDF, fiche + page web, pack territoire (sur devis).
- **Transparence** : données modélisées (ERA5), pas de valeur de station, ne remplace pas la vigilance Météo-France.
- **Questions fréquentes** et formulaire de contact.

## Données

Réanalyse ERA5 (Copernicus / ECMWF) via [Open-Meteo](https://open-meteo.com/) ; population INSEE. Aucun cookie ni traceur, aucun compte.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | La page complète (HTML et CSS, sans JavaScript) |
| `exemple-fiche-climat.pdf`, `exemple-fiche-neige.pdf`, `exemple-fiche-rechauffement.pdf`, `exemple-fiche-qualite-air.pdf` | Fiches d'exemple affichées dans la section « Exemples » |
| `commune.html` | Page web de la commune : `commune.html?insee=73116` (mode écran en mairie : `&kiosque=1`, avec QR code à scanner sur le côté de l'écran) |
| `qr-commune.html` | Lien et QR code d'une commune : `qr-commune.html?insee=73116` (copie du lien, QR code PNG 1200 px ou SVG, affichette A4 à imprimer) |
| `qr.js` | Générateur de QR code maison, sans bibliothèque |
| `communes.json`, `gestion-communes.html` | Communes activées et page de gestion (lien « QR » sur chaque ligne) |
| `logo-fef73.jpg` | Avatar affiché dans la signature du pied de page |
| `LICENSE` | Droits d'auteur (tous droits réservés) |
| `README.md` | Ce fichier |

## Droits

© 2026 Fernand (fef73) — tous droits réservés. Voir [LICENSE](LICENSE).

---

Créé par fef73 avec [Claude](https://claude.ai).
