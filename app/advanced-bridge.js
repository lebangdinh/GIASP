(() => {
  const allowed = new Set(['compare','promo','stock','pmh','catalog','sessions','vip']);
  let loaded = '';
  // The desk sends one normalized row per non-conflicting product. Only the source
  // prices enter the comparison engine. Customer quotes remain in the retail desk.
  function loadSlot(side, source) {
    const rows = source.rows;
    if (side === 'N') rawN = rows;
    else rawM = rows;
    document.getElementById('l' + side).value = source.label;
    document.getElementById('d' + side + '-nm').textContent = source.file;
    document.getElementById('d' + side + '-sub').textContent = rows.length + ' mã · ' + source.date;
    document.getElementById('dz' + side).classList.add('ok');
  }
  let pending = Promise.resolve();
  async function openRequest(event) {
    if (event.source !== parent || event.data?.type !== 'giasp-open') return;
    const {mode,current,previous} = event.data;
    if (!allowed.has(mode)) return;
    try {
      if (!current && loaded) {resetAll();loaded='';}
      if (current && loaded !== current.id) {
        resetAll();
        document.getElementById('manualCk').checked = false;
        toggleManual();
        selTpl(933,'Phụ kiện PKTI','pkti933',document.querySelector('[data-id="933"]'));
        if (previous) {loadSlot('N',previous);await PriceSessions.registerDesk('N',rawN,previous);}
        loadSlot('M',current);
        await PriceSessions.registerDesk('M',rawM,current);
        chkReady();
        loaded = current.id;
      }
      if(mode === 'catalog' && rawM) {
        catalogUpsertFromRows(Object.values(PriceSessions.parseSide('M',rawM)),tplName);
      }
      switchMainTab(mode === 'promo' ? 'compare' : mode);
      if(mode === 'promo' && (rawN || rawM)) doPromo();
      if(mode === 'compare' && rawN && rawM) doCmp();
    } catch(error) {toast('Không mở được chức năng: '+error.message,false);console.error(error);}
  }
  window.addEventListener('message',event=>{pending=pending.then(()=>openRequest(event)).catch(console.error)});
  if (parent !== window) parent.postMessage({type:'giasp-ready'},'*');
})();

