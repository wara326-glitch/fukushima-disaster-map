// Re-geocode every listed hospital from its registered address using GSI.
// This overrides stale / approximate hard-coded coordinates so marker dots align
// consistently with the official hospital address.
(async function refreshAllHospitalPositions(){
  if(!Array.isArray(hospitals)) return;
  const geocode=async h=>{
    if(!h.address) return false;
    try{
      const r=await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(h.address)}`);
      if(!r.ok) return false;
      const j=await r.json();
      const c=j?.[0]?.geometry?.coordinates;
      if(!c || c.length<2) return false;
      const lng=Number(c[0]),lat=Number(c[1]);
      if(!Number.isFinite(lat)||!Number.isFinite(lng)) return false;
      h.lat=lat; h.lng=lng; h.position_source="GSI address geocoding";
      return true;
    }catch(e){ return false; }
  };
  let ok=0;
  try{ status.textContent="病院位置を全件再確認中…"; }catch(e){}
  for(let i=0;i<hospitals.length;i+=5){
    const batch=hospitals.slice(i,i+5);
    const rs=await Promise.all(batch.map(geocode));
    ok+=rs.filter(Boolean).length;
    try{ status.textContent=`病院位置を全件再確認中… ${Math.min(i+5,hospitals.length)}/${hospitals.length}`; }catch(e){}
  }
  try{
    await drawHospitals();
    status.textContent=`病院位置を登録住所から再測位しました（${ok}/${hospitals.length}施設）。`;
  }catch(e){}
})();
