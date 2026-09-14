// 福島県内で一般検索に出にくい重要施設の検索補完
const SPECIAL_PLACES=[
  {
    name:"郡山消防署 中田分署",
    aliases:["郡山消防署中田分署","郡山消防署 中田分署","中田分署","郡山 中田分署"],
    address:"福島県郡山市中田町下枝字柏田202-1"
  }
];

function normalizeSpecialQuery(s){return String(s||"").replace(/[\s　・‐－―ー]/g,"").toLowerCase()}
function findSpecialPlace(q){const n=normalizeSpecialQuery(q);return SPECIAL_PLACES.find(p=>p.aliases.some(a=>normalizeSpecialQuery(a)===n||normalizeSpecialQuery(a).includes(n)||n.includes(normalizeSpecialQuery(a))))}

async function showSpecialPlaceCandidate(place){
  const box=searchCandidates;
  addressBtn.disabled=true;
  status.textContent="福島県内を検索中…";
  box.style.display="none";
  try{
    const r=await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(place.address)}`);
    if(!r.ok)throw 0;
    const j=await r.json();
    if(!j?.length)throw 0;
    const c=j[0].geometry?.coordinates||[];
    const lng=Number(c[0]),lat=Number(c[1]);
    if(!inFukushimaBounds(lat,lng))throw 0;
    box.innerHTML=`<div class="candidate" id="specialPlaceCandidate"><div class="ctitle">${place.name}</div><div class="cmeta">${place.address}</div></div>`;
    box.style.display="block";
    status.textContent="福島県内で1件の候補が見つかりました。";
    document.getElementById("specialPlaceCandidate").onclick=()=>{
      setIncident(lat,lng);
      map.setView([lat,lng],15);
      incidentText.innerHTML=`<b>${place.name}</b><br>${place.address}<br>緯度 ${lat.toFixed(5)} / 経度 ${lng.toFixed(5)}`;
      addressInput.value=place.name;
      box.style.display="none";
      status.textContent="発災地点を設定しました。";
    };
  }catch(e){
    status.textContent="地点検索に失敗しました。";
  }finally{
    addressBtn.disabled=false;
  }
}

const originalAddressClick=addressBtn.onclick;
addressBtn.onclick=()=>{
  const place=findSpecialPlace(addressInput.value.trim());
  if(place)return showSpecialPlaceCandidate(place);
  return originalAddressClick?.();
};

addressInput.addEventListener("keydown",e=>{
  if(e.key!=="Enter")return;
  const place=findSpecialPlace(addressInput.value.trim());
  if(!place)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  showSpecialPlaceCandidate(place);
},true);
