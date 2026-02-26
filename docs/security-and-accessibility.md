# Sécurité, accessibilité et résilience

## Contrôles de sécurité type "helmet" (approche FastAPI)

Le backend ajoute des en-têtes de sécurité comparables à ceux configurés via **helmet** côté Node.js :

- `X-Content-Type-Options: nosniff` : réduit les attaques de type MIME sniffing.
- `X-Frame-Options: DENY` : bloque le clickjacking via iframe.
- `Content-Security-Policy` : limite l'exécution de scripts et l'inclusion de ressources non attendues.
- `Referrer-Policy: strict-origin-when-cross-origin` : évite les fuites d'URL sensibles.
- `X-XSS-Protection` : protection legacy contre certains scénarios XSS sur navigateurs anciens.
- `Permissions-Policy` : coupe l'accès implicite à des APIs sensibles (caméra, micro, géolocalisation).

## Gestion d'erreur scanner et notifications client

- Si un scan ne trouve pas de produit dans le stock local ou OFF, l'API renvoie un code structuré `PRODUCT_NOT_FOUND`.
- Le client affiche une notification explicite quand un produit scanné est introuvable ou indisponible.

## Résilience réseau / cache

- Les appels `scan`, `search`, `listProducts` et `recommendations` utilisent un cache local (TTL) en fallback.
- En cas de coupure réseau, le client peut présenter les dernières données disponibles.

## Accessibilité

- Ajout de labels d'accessibilité (`accessibilityLabel`) et rôles (`accessibilityRole`) sur les actions clés.
- Messages UI explicites (notifications de contexte, erreurs et états dégradés).
- Contraste élevé conservé sur les boutons et textes critiques.

## Contrainte environnementale : faible luminosité

- Ajout d'un bouton lampe torche dans l'écran de scan.
- Message d'aide à l'ouverture du scanner pour guider l'utilisateur quand la luminosité est insuffisante.
