# Basketball Camp Kolašin — Website (Design C · "VRH")

Premium static marketing site for **Basketball Camp Kolašin** (Kolašin, Montenegro).

- Cinematic video hero, real photography, bilingual **Montenegrin / English (ME/EN)**
- Pages: Home, O nama, Smještaj/Tereni, Promoteri, MVP Hall of Fame
- Stack: vanilla HTML/CSS/JS + GSAP / ScrollTrigger / Lenis (CDN). **No build step.**

## Local development
```bash
node server.js   # → http://localhost:8092  (static server with HTTP Range support for <video>)
```

## Deploy
Pure static site — deploys to **Vercel** as-is (no build command, output = repo root).

## Pending content
- MVP winner photos → `assets/img/mvp/<year>.jpg` (auto-load, graceful fallback)
- Promoter names, confirmed coach portraits, EN proofread, real session prices/capacity
- Booking system: custom in-site flow + local Montenegrin bank gateway (AllSecure/WSPay) + Make
