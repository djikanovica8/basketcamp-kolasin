/* =====================================================================
   BASKETBALL CAMP KOLAŠIN — registration backend (Google Apps Script)
   ---------------------------------------------------------------------
   Container-bound to the "Prijave" Google Sheet, authorized as
   basketballcampkolasin@gmail.com. See automation/SETUP.md.

   What it does:
   • doPost {action:"register"} → new row + reference code (BCK27-NNN)
       + instant confirmation email to the parent (ME/EN)
       + notification email to the camp
   • doPost {action:"proof"}    → payment-slip file into Drive folder,
       linked into the matching row + notification to the camp
   • handleEdit (installable onEdit trigger) → when "Avans primljen ✓"
       is ticked, emails the parent "spot reserved" (double-send guarded)
   • dailyDigest (time-driven trigger, ~08:00) → reminds parents whose
       deposit proof hasn't arrived within 3 working days (once), and
       sends the camp a pending-list digest
   • setup() → run ONCE by hand: creates the sheet layout, the Drive
       folder and both triggers. Safe to re-run.
   ===================================================================== */

var CFG = {
  SHEET: "Prijave 2027",
  PROOF_FOLDER: "Uplatnice 2027",
  CODE_PREFIX: "BCK27",
  SITE: "https://www.basketcamp.me",
  CAMP_EMAIL: "basketballcampkolasin@gmail.com",   // notifications go here
  FROM_NAME: "Basketball Camp Kolašin",
  AVANS: 150,
  DEADLINE_WORKDAYS: 3,
  BANK: { name: "Hipotekarna banka AD Podgorica", acc: "520-20045-80", to: "Basket Kamp" },
  // authoritative prices per session index (I, II, III) — client value is ignored
  PRICES: { full: [450, 450, 490], train: [260, 260, 300] },
  SMJENA: {
    "1": { me: "Smjena I (26.06 – 01.07.2027.)", en: "Session I (26.06 – 01.07.2027)" },
    "2": { me: "Smjena II (01.07 – 06.07.2027.)", en: "Session II (01.07 – 06.07.2027)" },
    "3": { me: "Smjena III – Skills & Shooting (06.07 – 11.07.2027.)", en: "Session III – Skills & Shooting (06.07 – 11.07.2027)" }
  },
  PAKET: {
    full: { me: "Kompletan paket (treninzi + smještaj + ishrana)", en: "Complete package (trainings + stay + meals)" },
    train: { me: "Samo treninzi (bez smještaja i ishrane)", en: "Trainings only (no stay or meals)" }
  }
};

// Sheet columns (1-based). Keep in sync with setup().
var COL = {
  VRIJEME: 1, KOD: 2, STATUS: 3, IME: 4, PREZIME: 5, RODJENJE: 6, POL: 7,
  DRZAVA: 8, GRAD: 9, KLUB: 10, VISINA: 11, TEZINA: 12, OPREMA: 13,
  SMJENA: 14, PAKET: 15, CIJENA: 16, EMAIL: 17, TELEFON: 18, NAPOMENA: 19,
  JEZIK: 20, UPLATNICA: 21, UPLATNICA_VRIJEME: 22, AVANS: 23,
  POTVRDA_POSLATA: 24, PODSJETNIK: 25
};
var LAST_COL = 25;

var STATUS = {
  NOVA: "Prijavljen",
  DOKAZ: "Uplatnica poslata",
  POTVRDJEN: "Potvrđeno ✅",
  ODJAVLJEN: "Odjavljen"
};

/* ============================ WEB APP ============================ */

function doGet() {
  return json_({ ok: true, service: "bck-registration" });
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d && d.action === "register") return register_(d);
    if (d && d.action === "proof") return proof_(d);
    return json_({ ok: false, error: "unknown action" });
  } catch (err) {
    log_("doPost error: " + err);
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================ REGISTER ============================ */

function register_(d) {
  // minimal validation — the site validates properly; this is a backstop
  var ime = clean_(d.ime), prezime = clean_(d.prezime), email = clean_(d.email);
  if (!ime || !prezime || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json_({ ok: false, error: "invalid data" });
  }
  var lang = d.lang === "en" ? "en" : "me";
  var smjenaKey = ["1", "2", "3"].indexOf(String(d.smjena)) !== -1 ? String(d.smjena) : "1";
  var paketKey = d.paket === "train" ? "train" : "full";
  var smjena = CFG.SMJENA[smjenaKey];
  var paket = CFG.PAKET[paketKey];
  var cijena = CFG.PRICES[paketKey][+smjenaKey - 1]; // server-side — never trust the client's number

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var code;
  try {
    code = nextCode_();
    var sh = sheet_();
    sh.appendRow([
      new Date(), code, STATUS.NOVA,
      cell_(ime), cell_(prezime), cell_(d.rodjenje), cell_(d.pol),
      cell_(d.drzava), cell_(d.grad), cell_(d.klub),
      cell_(d.visina), cell_(d.tezina), cell_(d.oprema),
      smjena.me, paket.me, cijena,
      email, cell_(d.telefon), cell_(d.napomena),
      lang, "", "", false, "", ""
    ]);
    sh.getRange(sh.getLastRow(), COL.AVANS).insertCheckboxes();
  } finally {
    lock.releaseLock();
  }

  // emails outside the lock — a failure here must not lose the row
  try { sendConfirmation_(code, ime, prezime, email, lang, smjena[lang], paket[lang], cijena); }
  catch (err) { log_("confirmation email failed for " + code + ": " + err); }
  try { notifyOwnerNew_(code, d, smjena.me, paket.me, cijena); }
  catch (err) { log_("owner notify failed for " + code + ": " + err); }

  return json_({ ok: true, code: code });
}

function nextCode_() {
  var props = PropertiesService.getScriptProperties();
  var n = Number(props.getProperty("counter") || 0);
  if (!n) {
    // initialize from the highest existing code so codes are never reused
    var sh = sheet_();
    var last = sh.getLastRow();
    if (last > 1) {
      sh.getRange(2, COL.KOD, last - 1, 1).getValues().forEach(function (r) {
        var m = /-(\d+)$/.exec(String(r[0] || ""));
        if (m) n = Math.max(n, Number(m[1]));
      });
    }
  }
  n++;
  props.setProperty("counter", String(n));
  var s = String(n);
  return CFG.CODE_PREFIX + "-" + (s.length < 3 ? ("000" + s).slice(-3) : s);
}

/* ============================ PROOF ============================ */

function proof_(d) {
  var ime = clean_(d.ime), code = clean_(d.code).toUpperCase();
  if (!d.data || String(d.data).length < 100) return json_({ ok: false, error: "no file" });

  var bytes;
  try { bytes = Utilities.base64Decode(String(d.data)); }
  catch (err) { return json_({ ok: false, error: "bad file" }); }

  var safeName = ((code ? code + " " : "") + (ime || "uplatnica")).replace(/[\\/:*?"<>|]/g, "").slice(0, 80);
  var ext = extFor_(clean_(d.mime), clean_(d.filename));
  var blob = Utilities.newBlob(bytes, clean_(d.mime) || "application/octet-stream", safeName + ext);
  var file = folder_().createFile(blob);
  var url = file.getUrl();

  // link the file into the matching row
  var row = findRow_(code, ime);
  if (row) {
    var sh = sheet_();
    sh.getRange(row, COL.UPLATNICA).setValue(url);
    sh.getRange(row, COL.UPLATNICA_VRIJEME).setValue(new Date());
    if (sh.getRange(row, COL.STATUS).getValue() === STATUS.NOVA) {
      sh.getRange(row, COL.STATUS).setValue(STATUS.DOKAZ);
    }
  }

  try { notifyOwnerProof_(code, ime, url, row); }
  catch (err) { log_("owner proof notify failed: " + err); }

  return json_({ ok: true });
}

function findRow_(code, ime) {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var data = sh.getRange(2, 1, last - 1, LAST_COL).getValues();
  if (code) {
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][COL.KOD - 1]).toUpperCase() === code) return i + 2;
    }
  }
  if (ime) {
    var norm = normalize_(ime);
    for (var j = 0; j < data.length; j++) {
      var full = normalize_(data[j][COL.IME - 1] + " " + data[j][COL.PREZIME - 1]);
      var rev = normalize_(data[j][COL.PREZIME - 1] + " " + data[j][COL.IME - 1]);
      if (full === norm || rev === norm) return j + 2;
    }
  }
  return 0;
}

function extFor_(mime, filename) {
  if (/jpe?g/i.test(mime)) return ".jpg";
  if (/png/i.test(mime)) return ".png";
  if (/pdf/i.test(mime)) return ".pdf";
  if (/heic|heif/i.test(mime)) return ".heic";
  if (/webp/i.test(mime)) return ".webp";
  var m = /(\.[a-z0-9]{2,5})$/i.exec(filename || "");
  return m ? m[1] : "";
}

/* ============================ ONE-CLICK CONFIRM ============================ */

// Installed by setup() as an installable onEdit trigger.
// Iterates the whole edited rectangle so drag-fills and multi-cell pastes
// of the checkbox column confirm every affected row, not just the first.
function handleEdit(e) {
  try {
    var range = e.range;
    var sh = range.getSheet();
    if (sh.getName() !== CFG.SHEET) return;
    if (range.getColumn() > COL.AVANS || range.getLastColumn() < COL.AVANS) return;
    var first = Math.max(range.getRow(), 2);
    var last = range.getLastRow();
    for (var row = first; row <= last; row++) confirmRow_(sh, row);
  } catch (err) {
    log_("handleEdit error: " + err);
  }
}

function confirmRow_(sh, row) {
  if (sh.getRange(row, COL.AVANS).getValue() !== true) return;
  if (sh.getRange(row, COL.POTVRDA_POSLATA).getValue()) return; // double-send guard

  var kod = sh.getRange(row, COL.KOD).getValue();
  var ime = sh.getRange(row, COL.IME).getValue();
  var prezime = sh.getRange(row, COL.PREZIME).getValue();
  var email = sh.getRange(row, COL.EMAIL).getValue();
  var lang = sh.getRange(row, COL.JEZIK).getValue() === "en" ? "en" : "me";
  var smjena = sh.getRange(row, COL.SMJENA).getValue();
  if (lang === "en") {
    // the sheet stores the ME label — map it back for English emails
    for (var k in CFG.SMJENA) {
      if (CFG.SMJENA[k].me === smjena) { smjena = CFG.SMJENA[k].en; break; }
    }
  }
  if (!email) return;

  sendReserved_(kod, ime, prezime, email, lang, smjena);
  sh.getRange(row, COL.POTVRDA_POSLATA).setValue(new Date());
  sh.getRange(row, COL.STATUS).setValue(STATUS.POTVRDJEN);
}

/* ============================ DAILY DIGEST + REMINDERS ============================ */

// Installed by setup() as a daily time-driven trigger (around 08:00).
function dailyDigest() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return;
  var data = sh.getRange(2, 1, last - 1, LAST_COL).getValues();
  var now = new Date();
  var pending = [], reminded = [];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var status = r[COL.STATUS - 1];
    if (status !== STATUS.NOVA) continue;               // proof arrived / confirmed / cancelled
    var made = r[COL.VRIJEME - 1];
    var name = r[COL.IME - 1] + " " + r[COL.PREZIME - 1];
    var kod = r[COL.KOD - 1];
    if (!(made instanceof Date)) { pending.push(kod + " — " + name + " (bez datuma)"); continue; }
    pending.push(kod + " — " + name + " (" + Utilities.formatDate(made, Session.getScriptTimeZone(), "dd.MM.") + ")");
    var overdue = workdaysBetween_(made, now) >= CFG.DEADLINE_WORKDAYS;
    var alreadyReminded = !!r[COL.PODSJETNIK - 1];
    var email = r[COL.EMAIL - 1];
    if (overdue && !alreadyReminded && email) {
      var lang = r[COL.JEZIK - 1] === "en" ? "en" : "me";
      try {
        sendReminder_(kod, r[COL.IME - 1], r[COL.PREZIME - 1], email, lang);
        sh.getRange(i + 2, COL.PODSJETNIK).setValue(new Date());
        reminded.push(kod + " — " + name);
      } catch (err) { log_("reminder failed for " + kod + ": " + err); }
    }
  }

  if (pending.length) {
    var body = "Prijave koje čekaju avans (" + pending.length + "):\n\n" + pending.join("\n");
    if (reminded.length) body += "\n\nAutomatski podsjetnik poslat danas:\n" + reminded.join("\n");
    body += "\n\nTabela: " + SpreadsheetApp.getActive().getUrl();
    MailApp.sendEmail({
      to: CFG.CAMP_EMAIL, name: CFG.FROM_NAME,
      subject: "⏳ " + pending.length + " prijava čeka avans — Basketball Camp Kolašin",
      body: body
    });
  }
}

function workdaysBetween_(a, b) {
  var count = 0;
  var d = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  var end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  while (d < end) {
    d.setDate(d.getDate() + 1);
    var day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

/* ============================ EMAILS ============================ */

function brandEmail_(title, bodyHtml, lang) {
  var followTxt = lang === "en" ? "See you on the mountain" : "Vidimo se na planini";
  return '' +
    '<div style="margin:0;padding:24px 12px;background:#efe9e0;font-family:Helvetica,Arial,sans-serif">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto">' +
    '<tr><td style="padding:0 4px 14px" align="center">' +
    '<img src="' + CFG.SITE + '/assets/logo/logo.png" width="64" alt="Basketball Camp Kolašin" style="display:block;margin:0 auto">' +
    '</td></tr>' +
    '<tr><td style="background:#161210;border-radius:18px;padding:30px 28px;color:#f3ede3">' +
    '<h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#f3ede3">' + title + '</h1>' +
    bodyHtml +
    '</td></tr>' +
    '<tr><td align="center" style="padding:16px 8px;color:#6e6557;font-size:12px;line-height:1.5">' +
    followTxt + ' 🏔️🏀<br>Basketball Camp Kolašin · Kolašin, Crna Gora<br>' +
    '<a href="' + CFG.SITE + '" style="color:#d85f0d">' + CFG.SITE.replace("https://", "") + '</a> · ' +
    '<a href="mailto:' + CFG.CAMP_EMAIL + '" style="color:#d85f0d">' + CFG.CAMP_EMAIL + '</a> · WhatsApp/Viber 067 032 132' +
    '</td></tr></table></div>';
}

function payBlock_(refValue, lang) {
  var L = lang === "en"
    ? { bank: "Bank", acc: "Account number", to: "Recipient", amt: "Deposit", ref: "Payment reference", note: "Please write the payment reference exactly as shown — it links your payment to the registration." }
    : { bank: "Banka", acc: "Broj računa", to: "Primalac", amt: "Avans", ref: "Svrha uplate", note: "Molimo upišite svrhu uplate tačno kako je navedena — tako se vaša uplata automatski povezuje sa prijavom." };
  function row(k, v) {
    return '<tr><td style="padding:6px 0;color:#caa14a;font-size:11px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;vertical-align:top">' + k + '</td>' +
      '<td style="padding:6px 0 6px 16px;color:#f3ede3;font-size:14px;font-weight:bold">' + v + '</td></tr>';
  }
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#211a14;border:1px solid rgba(202,161,74,.4);border-radius:12px;padding:6px 16px;margin:16px 0 6px"><tbody>' +
    row(L.bank, CFG.BANK.name) + row(L.acc, CFG.BANK.acc) + row(L.to, CFG.BANK.to) +
    row(L.amt, CFG.AVANS + " €") + row(L.ref, refValue) +
    '</tbody></table>' +
    '<p style="margin:6px 0 0;color:#a89d8c;font-size:12px;line-height:1.5">' + L.note + '</p>';
}

function sendConfirmation_(code, ime, prezime, email, lang, smjenaLabel, paketLabel, cijena) {
  var ref = code + " — " + esc_(ime) + " " + esc_(prezime);
  var uploadUrl = CFG.SITE + "/uplata.html?code=" + encodeURIComponent(code);
  var en = lang === "en";
  var title = en ? "Registration received! 🏀" : "Prijava primljena! 🏀";
  var subject = en
    ? code + " · Registration — Basketball Camp Kolašin 2027"
    : code + " · Prijava — Basketball Camp Kolašin 2027";

  var p1 = en
    ? "Hi! We've received the registration for <b>" + esc_(ime) + " " + esc_(prezime) + "</b> — " + smjenaLabel + ", " + paketLabel + (cijena ? " (" + cijena + " €)" : "") + "."
    : "Zdravo! Primili smo prijavu za <b>" + esc_(ime) + " " + esc_(prezime) + "</b> — " + smjenaLabel + ", " + paketLabel + (cijena ? " (" + cijena + " €)" : "") + ".";
  var p2 = en
    ? "Your registration number is <b style='color:#dcbb6a'>" + code + "</b>. To secure the spot, please pay the <b>" + CFG.AVANS + " € deposit within " + CFG.DEADLINE_WORKDAYS + " working days</b>:"
    : "Vaš broj prijave je <b style='color:#dcbb6a'>" + code + "</b>. Da biste osigurali mjesto, uplatite <b>avans od " + CFG.AVANS + " € u roku od " + CFG.DEADLINE_WORKDAYS + " radna dana</b>:";
  var p3 = en
    ? "After paying, send us a photo of the payment slip — it takes 30 seconds:"
    : "Nakon uplate pošaljite nam fotografiju uplatnice — traje 30 sekundi:";
  var btn = en ? "Upload the payment slip" : "Pošalji uplatnicu";
  var alt = en
    ? "You can also send it on WhatsApp/Viber to <b>067 032 132</b> or reply to this email. Paying from abroad? Reply to this email and we'll send international payment instructions (IBAN/SWIFT)."
    : "Možete je poslati i na WhatsApp/Viber <b>067 032 132</b> ili odgovorom na ovaj email. Plaćate iz inostranstva? Odgovorite na ovaj email i šaljemo INO instrukcije (IBAN/SWIFT).";
  var rules = en
    ? "By paying for participation you accept the <a href='" + CFG.SITE + "/pravilnik.html' style='color:#d85f0d'>camper code of conduct</a>."
    : "Uplatom za učešće prihvatate <a href='" + CFG.SITE + "/pravilnik.html' style='color:#d85f0d'>Pravilnik ponašanja kampera</a>.";

  var body =
    '<p style="margin:0 0 12px;color:#e4dccf;font-size:14px;line-height:1.6">' + p1 + '</p>' +
    '<p style="margin:0 0 4px;color:#e4dccf;font-size:14px;line-height:1.6">' + p2 + '</p>' +
    payBlock_(ref, lang) +
    '<p style="margin:18px 0 12px;color:#e4dccf;font-size:14px;line-height:1.6">' + p3 + '</p>' +
    '<p style="margin:0 0 16px"><a href="' + uploadUrl + '" style="display:inline-block;background:#f2741a;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:99px">' + btn + ' →</a></p>' +
    '<p style="margin:0 0 12px;color:#a89d8c;font-size:12px;line-height:1.6">' + alt + '</p>' +
    '<p style="margin:0;color:#a89d8c;font-size:12px;line-height:1.6">' + rules + '</p>';

  MailApp.sendEmail({
    to: email, name: CFG.FROM_NAME, replyTo: CFG.CAMP_EMAIL,
    subject: subject, htmlBody: brandEmail_(title, body, lang),
    body: (en ? "Registration number: " : "Broj prijave: ") + code + "\n" +
      CFG.BANK.name + " · " + CFG.BANK.acc + " · " + CFG.BANK.to + "\n" +
      (en ? "Deposit: " : "Avans: ") + CFG.AVANS + " €\n" +
      (en ? "Reference: " : "Svrha uplate: ") + ref + "\n" + uploadUrl
  });
}

function sendReserved_(code, ime, prezime, email, lang, smjenaLabel) {
  var en = lang === "en";
  var title = en ? "The spot is reserved! ✅" : "Mjesto je rezervisano! ✅";
  var subject = en
    ? code + " · Spot reserved — Basketball Camp Kolašin 2027"
    : code + " · Mjesto rezervisano — Basketball Camp Kolašin 2027";
  var p1 = en
    ? "Great news — we've received the deposit and <b>" + esc_(ime) + " " + esc_(prezime) + "</b> officially has a spot at Basketball Camp Kolašin 2027" + (smjenaLabel ? " (" + smjenaLabel + ")" : "") + "."
    : "Sjajne vijesti — avans je stigao i <b>" + esc_(ime) + " " + esc_(prezime) + "</b> zvanično ima mjesto na Basketball Camp-u Kolašin 2027" + (smjenaLabel ? " (" + smjenaLabel + ")" : "") + ".";
  var p2 = en
    ? "The remaining amount is paid before the start of camp. A complete packing list and all practical details arrive by email before the season — and if you have any questions, just reply to this email or write on WhatsApp/Viber <b>067 032 132</b>."
    : "Ostatak iznosa izmiruje se prije početka kampa. Kompletan spisak stvari i sve praktične informacije stižu emailom prije sezone — a za svako pitanje odgovorite na ovaj email ili pišite na WhatsApp/Viber <b>067 032 132</b>.";
  var body =
    '<p style="margin:0 0 12px;color:#e4dccf;font-size:14px;line-height:1.6">' + p1 + '</p>' +
    '<p style="margin:0;color:#e4dccf;font-size:14px;line-height:1.6">' + p2 + '</p>';
  MailApp.sendEmail({
    to: email, name: CFG.FROM_NAME, replyTo: CFG.CAMP_EMAIL,
    subject: subject, htmlBody: brandEmail_(title, body, lang),
    body: (en ? "Spot reserved for " : "Mjesto rezervisano za ") + ime + " " + prezime + " (" + code + ")."
  });
}

function sendReminder_(code, ime, prezime, email, lang) {
  var ref = code + " — " + esc_(ime) + " " + esc_(prezime);
  var uploadUrl = CFG.SITE + "/uplata.html?code=" + encodeURIComponent(code);
  var en = lang === "en";
  var title = en ? "Your spot is waiting 🏀" : "Vaše mjesto čeka 🏀";
  var subject = en
    ? code + " · Deposit reminder — Basketball Camp Kolašin 2027"
    : code + " · Podsjetnik za avans — Basketball Camp Kolašin 2027";
  var p1 = en
    ? "A friendly reminder — the registration for <b>" + esc_(ime) + " " + esc_(prezime) + "</b> is still waiting for the " + CFG.AVANS + " € deposit that secures the spot. Sessions fill up quickly, so here are the details once more:"
    : "Ljubazno podsjećamo — prijava za <b>" + esc_(ime) + " " + esc_(prezime) + "</b> još čeka avans od " + CFG.AVANS + " € koji osigurava mjesto. Smjene se brzo popune, zato još jednom šaljemo podatke:";
  var p2 = en
    ? "Already paid? Fantastic — just send us the payment slip and we'll confirm the reservation right away:"
    : "Već ste uplatili? Odlično — samo nam pošaljite uplatnicu i odmah potvrđujemo rezervaciju:";
  var btn = en ? "Upload the payment slip" : "Pošalji uplatnicu";
  var body =
    '<p style="margin:0 0 4px;color:#e4dccf;font-size:14px;line-height:1.6">' + p1 + '</p>' +
    payBlock_(ref, lang) +
    '<p style="margin:18px 0 12px;color:#e4dccf;font-size:14px;line-height:1.6">' + p2 + '</p>' +
    '<p style="margin:0"><a href="' + uploadUrl + '" style="display:inline-block;background:#f2741a;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:99px">' + btn + ' →</a></p>';
  MailApp.sendEmail({
    to: email, name: CFG.FROM_NAME, replyTo: CFG.CAMP_EMAIL,
    subject: subject, htmlBody: brandEmail_(title, body, lang),
    body: (en ? "Deposit reminder for " : "Podsjetnik za avans — ") + ref + "\n" + uploadUrl
  });
}

function notifyOwnerNew_(code, d, smjenaLabel, paketLabel, cijena) {
  var name = clean_(d.ime) + " " + clean_(d.prezime);
  var lines = [
    "Kod: " + code,
    "Igrač: " + name + " (" + clean_(d.rodjenje) + ", " + clean_(d.pol) + ")",
    "Klub: " + (clean_(d.klub) || "—"),
    "Visina/Težina: " + clean_(d.visina) + " cm / " + clean_(d.tezina) + " kg · Oprema: " + clean_(d.oprema),
    "Iz: " + clean_(d.grad) + ", " + clean_(d.drzava),
    "Smjena: " + smjenaLabel,
    "Paket: " + paketLabel + (cijena ? " · " + cijena + " €" : ""),
    "Email: " + clean_(d.email),
    "Telefon: " + clean_(d.telefon),
    "Napomena: " + (clean_(d.napomena) || "—"),
    "",
    "Tabela: " + SpreadsheetApp.getActive().getUrl()
  ];
  MailApp.sendEmail({
    to: CFG.CAMP_EMAIL, name: CFG.FROM_NAME,
    subject: "🏀 Nova prijava: " + name + " · " + smjenaLabel.split(" (")[0] + " · " + code,
    body: lines.join("\n")
  });
}

function notifyOwnerProof_(code, ime, url, row) {
  var matched = row ? "Povezana sa prijavom (red " + row + ")." : "⚠️ NIJE automatski povezana ni sa jednom prijavom — provjerite ručno.";
  MailApp.sendEmail({
    to: CFG.CAMP_EMAIL, name: CFG.FROM_NAME,
    subject: "💶 Uplatnica: " + (ime || code || "nepoznato"),
    body: "Stigla je uplatnica.\n\nIgrač: " + (ime || "—") + "\nKod: " + (code || "—") + "\n" + matched +
      "\n\nFajl: " + url +
      "\n\nKada provjerite uplatu, u tabeli štiklirajte kolonu „Avans primljen ✓“ — roditelju automatski stiže potvrda." +
      "\n\nTabela: " + SpreadsheetApp.getActive().getUrl()
  });
}

/* ============================ SETUP (run once) ============================ */

function setup() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(CFG.SHEET) || ss.insertSheet(CFG.SHEET);

  var headers = [
    "Vrijeme", "Kod", "Status", "Ime", "Prezime", "Datum rođenja", "Pol",
    "Država", "Grad", "Klub", "Visina", "Težina", "Oprema",
    "Smjena", "Paket", "Cijena (€)", "Email roditelja", "Telefon", "Napomena",
    "Jezik", "Uplatnica", "Uplatnica stigla", "Avans primljen ✓",
    "Potvrda poslata", "Podsjetnik poslat"
  ];
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight("bold").setBackground("#161210").setFontColor("#f3ede3");
  sh.setFrozenRows(1);
  sh.setFrozenColumns(3);

  // repair: whole-column checkboxes would poison getLastRow()/appendRow() —
  // wipe any stray content below the last real registration (checkboxes are
  // added per-row when a registration arrives)
  var maxR = sh.getMaxRows();
  var lastReal = 1;
  var kodVals = sh.getRange(1, COL.KOD, maxR, 1).getValues();
  for (var ri = maxR - 1; ri >= 1; ri--) { if (kodVals[ri][0]) { lastReal = ri + 1; break; } }
  if (maxR > lastReal) {
    sh.getRange(lastReal + 1, 1, maxR - lastReal, LAST_COL).clearContent().clearDataValidations();
  }
  if (lastReal > 1) sh.getRange(2, COL.AVANS, lastReal - 1, 1).insertCheckboxes();
  // let the counter re-derive itself from the highest code in the sheet
  PropertiesService.getScriptProperties().deleteProperty("counter");

  // status dropdown chips (validation is not content — safe on the whole column)
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([STATUS.NOVA, STATUS.DOKAZ, STATUS.POTVRDJEN, STATUS.ODJAVLJEN], true)
    .setAllowInvalid(true).build();
  sh.getRange(2, COL.STATUS, sh.getMaxRows() - 1, 1).setDataValidation(statusRule);

  // conditional colors for status
  var rangeA1 = sh.getRange(2, COL.STATUS, sh.getMaxRows() - 1, 1);
  sh.setConditionalFormatRules([
    ruleEq_(rangeA1, STATUS.NOVA, "#fdeacc"),
    ruleEq_(rangeA1, STATUS.DOKAZ, "#d7e8f7"),
    ruleEq_(rangeA1, STATUS.POTVRDJEN, "#d8ecd4"),
    ruleEq_(rangeA1, STATUS.ODJAVLJEN, "#eeeeee")
  ]);

  // sensible widths
  sh.setColumnWidth(COL.VRIJEME, 130); sh.setColumnWidth(COL.KOD, 90);
  sh.setColumnWidth(COL.STATUS, 140); sh.setColumnWidth(COL.NAPOMENA, 220);
  sh.setColumnWidth(COL.UPLATNICA, 180); sh.setColumnWidth(COL.EMAIL, 200);

  // Drive folder for payment slips
  folder_();

  // triggers (installable) — remove old copies first so setup is re-runnable
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === "handleEdit" || fn === "dailyDigest") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("handleEdit").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("dailyDigest").timeBased().everyDays(1).atHour(8).create();

  Logger.log("Setup complete. Sheet '" + CFG.SHEET + "' ready, folder '" + CFG.PROOF_FOLDER + "' ready, triggers installed.");
}

function ruleEq_(range, text, color) {
  return SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(text).setBackground(color).setRanges([range]).build();
}

// quick smoke test: sends a sample confirmation to the camp inbox
function testEmail() {
  sendConfirmation_(CFG.CODE_PREFIX + "-000", "Test", "Testović", CFG.CAMP_EMAIL, "me",
    CFG.SMJENA["2"].me, CFG.PAKET.full.me, 450);
  Logger.log("Test email sent to " + CFG.CAMP_EMAIL);
}

/* ============================ HELPERS ============================ */

function sheet_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(CFG.SHEET);
  if (!sh) throw new Error("Sheet '" + CFG.SHEET + "' not found — run setup() first.");
  return sh;
}

function folder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("folderId");
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* deleted — recreate */ }
  }
  var it = DriveApp.getFoldersByName(CFG.PROOF_FOLDER);
  var folder = it.hasNext() ? it.next() : DriveApp.createFolder(CFG.PROOF_FOLDER);
  props.setProperty("folderId", folder.getId());
  return folder;
}

function clean_(v) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 500);
}

// only for values written into sheet cells: a leading = + @ would otherwise
// be interpreted as a formula (Sheets consumes the apostrophe as a text marker)
function cell_(v) {
  var s = clean_(v);
  return /^[=+@]/.test(s) ? "'" + s : s;
}

function esc_(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function normalize_(s) {
  return String(s || "").toLowerCase()
    .replace(/š/g, "s").replace(/đ/g, "dj").replace(/č/g, "c").replace(/ć/g, "c").replace(/ž/g, "z")
    .replace(/\s+/g, " ").trim();
}

function log_(msg) {
  try { console.error(msg); } catch (e) {}
}
