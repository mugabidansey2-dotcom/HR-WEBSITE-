/* PAYROLL RULES. Edit this file when the law changes, save it, and upload it again.
   Each set applies from the pay month in "from" (YYYY-MM) until the next set starts.
   bands: [upper limit of the band in UGX per month, tax rate % on the part of pay inside the band]. Use null for "no upper limit".
   nssfEmployee / nssfEmployer: % of gross pay.

   Source of these figures: published summaries of Uganda's Income Tax (Amendment) Act 2026 (effective 1 July 2026)
   and the 2025/26 rules. They are NOT taken from URA itself, so confirm them with URA and NSSF before real use. */
window.BU_RULES=[
  {from:'2000-01',label:'Before 1 July 2026',nssfEmployee:5,nssfEmployer:10,
   bands:[[235000,0],[335000,10],[410000,20],[10000000,30],[null,40]]},
  {from:'2026-07',label:'From 1 July 2026',nssfEmployee:5,nssfEmployer:10,
   bands:[[335000,0],[410000,20],[485000,25],[10000000,30],[null,40]]}
];
