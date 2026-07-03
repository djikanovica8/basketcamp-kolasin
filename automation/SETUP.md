# Registracioni sistem — podešavanje (10 minuta, jednom)

Sve radi besplatno preko Google naloga kampa (**basketballcampkolasin@gmail.com**):
prijave sa sajta upadaju u Google tabelu, roditelj odmah dobija email sa instrukcijama
za uplatu i brojem prijave (BCK27-001…), uplatnice se čuvaju u Google Drive,
a kada Savo štiklira „Avans primljen ✓“ — roditelju automatski stiže potvrda rezervacije.

> **Važno:** sve korake raditi ulogovan kao **basketballcampkolasin@gmail.com**
> (da emailovi stižu sa adrese kampa).

## 1. Napravi tabelu

1. Otvori [sheets.new](https://sheets.new)
2. Nazovi je npr. **„Basketball Camp Kolašin — Prijave“** (ime nije bitno)

## 2. Ubaci skriptu

1. U tabeli: meni **Extensions → Apps Script** (Proširenja → Apps Script)
2. Obriši sve što piše u fajlu `Code.gs` i nalijepi kompletan sadržaj fajla
   [`automation/apps-script/Code.gs`](apps-script/Code.gs) iz ovog repozitorijuma
3. Klikni **💾 Save** (ikonica diskete)

## 3. Pokreni `setup()` (jednom)

1. U padajućem meniju iznad koda (pored „Debug“) izaberi funkciju **`setup`**
2. Klikni **▶ Run**
3. Google traži dozvole → **Review permissions** → izaberi nalog kampa →
   *„Google hasn't verified this app“* → **Advanced → Go to … (unsafe)** → **Allow**
   (normalno je — skripta je naša i traži pristup samo ovoj tabeli, Drive-u i slanju emaila)
4. Kad prođe, u tabeli se pojavljuje list **„Prijave 2027“** sa svim kolonama,
   u Drive-u folder **„Uplatnice 2027“**, i oba okidača (potvrda + dnevni podsjetnik)

## 4. Objavi kao web-app

1. Gore desno: **Deploy → New deployment**
2. Klikni zupčanik ⚙️ pored „Select type“ → **Web app**
3. Podesi:
   - **Execute as:** `Me (basketballcampkolasin@gmail.com)`
   - **Who has access:** `Anyone`
4. **Deploy** → kopiraj **Web app URL** (počinje sa `https://script.google.com/macros/s/…/exec`)

## 5. Upiši URL u sajt

1. U repozitorijumu otvori [`js/config.js`](../js/config.js)
2. Nalijepi URL:
   ```js
   window.BCK_CFG = {
     regEndpoint: "https://script.google.com/macros/s/…tvoj URL…/exec"
   };
   ```
3. Commit + deploy sajta — **to je sve**.

## 6. Probaj (2 minuta)

1. Na sajtu popuni prijavu sa svojim emailom → mora stići email sa brojem prijave,
   a red se pojavljuje u tabeli i stiže notifikacija kampu
2. Otvori link „Pošalji uplatnicu“ iz emaila → pošalji bilo koju sliku →
   slika je u Drive folderu, red dobija link, kampu stiže notifikacija
3. U tabeli štikliraj **„Avans primljen ✓“** u tom redu → roditelju (tebi) stiže
   potvrda rezervacije, status prelazi u „Potvrđeno ✅“
4. Obriši probni red iz tabele

*(Brzi test emaila bez sajta: u Apps Script-u pokreni funkciju `testEmail` —
šalje primjer potvrde na adresu kampa.)*

---

## Kako Savo koristi sistem (dnevno)

1. Stigne email **„🏀 Nova prijava …“** — ništa ne mora da radi, roditelju su
   instrukcije već poslate
2. Stigne email **„💶 Uplatnica: …“** — otvori sliku iz emaila, provjeri uplatu
3. U tabeli (radi i sa telefona, aplikacija **Google Sheets**) štiklira
   **„Avans primljen ✓“** — roditelj automatski dobija potvrdu. **To je sve.**
4. Svako jutro u ~8h stiže pregled prijava koje još čekaju avans;
   roditelj koji kasni više od 3 radna dana automatski dobija ljubazan podsjetnik (jednom)

## Ako nešto zatreba promijeniti (nova sezona / nove cijene)

Podaci o sezoni žive na **četiri mjesta** — promijeniti sva:

1. **`Code.gs` — blok `CFG`** (vrh fajla): `PRICES` (cijene paketa po smjeni),
   `AVANS`, `DEADLINE_WORKDAYS`, `BANK`, nazivi/termini smjena u `SMJENA`,
   i za novu sezonu `SHEET`, `PROOF_FOLDER`, `CODE_PREFIX` (npr. BCK28).
   Zatim **Deploy → Manage deployments → ✏️ → New version → Deploy** (URL ostaje isti).
2. **`js/main.js` — blok `REG`**: `prices` (koristi ih kalkulator ukupne cijene
   i bedževi na karticama paketa).
3. **`index.html` — sekcija `#register`**: datumi smjena u `.rw__optSub`,
   precrtana cijena `#rwOld` (520 €), granice datuma rođenja (`min`/`max`),
   plus datumi na karticama u sekciji „Termini“ (`.se__date`).
4. **`js/i18n.js` (+ zadani tekstovi u `index.html`)**: iznos avansa od 150 €
   pominje se u tekstovima `rw.avans`, `rw.done.deadline`, `se.note` i `fq.a8`,
   u OBA jezika.

## Ograničenja (dovoljna za kamp)

- Gmail (besplatni) šalje najviše **100 emailova dnevno** iz skripte — kamp šalje
  2–3 po prijavi, dakle i 30 prijava u jednom danu je bezbjedno
- Dok `regEndpoint` u `js/config.js` stoji prazan, sajt i dalje prima prijave —
  otvara roditelju unaprijed popunjen email/WhatsApp (ništa se ne gubi)
