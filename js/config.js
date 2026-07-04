/* =====================================================================
   BCK site config — the ONE place to connect the registration backend.

   After deploying the Google Apps Script web app (see automation/SETUP.md),
   paste its /exec URL between the quotes below, e.g.:
     regEndpoint: "https://script.google.com/macros/s/AKfycb.../exec"

   While the URL is empty, the registration form still works: it falls
   back to prefilled email/WhatsApp so no registration is ever lost.
   ===================================================================== */
window.BCK_CFG = {
  regEndpoint: "https://script.google.com/macros/s/AKfycbw27q9qPk-Qa2ONFI9RfD6g3dT24MeM5J2bIPH_EpcXGW0vr99PGmmpSkJgQwQqR6k9Mw/exec"
};
