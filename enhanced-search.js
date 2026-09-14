// 福島県内の発災地点検索を補強：消防・警察・診療所等を優先的に検索
const IMPORTANT_SPECIAL_PLACES=[
  {
    name:"郡山消防署 中田分署",
    aliases:["郡山消防署中田分署","郡山消防署 中田分署","中田分署","郡山 中田分署"],
    address:"福島県郡山市中田町下枝字柏田202-1"
  }
];

function normalizePlaceText(s){
  return String(s||"").replace(/[\s　・‐－―ー]/g,"").toLowerCase();
}

function escapeRegExp(s){
  return String(s||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
}

function importantCategoryLabel(tags={}){
  if(tags.amenity==="fire_station") return "消防署・分署・出張所";
  if(tags.amenity==="police") return "警察署・交番・駐在所";
  if(tags.amenity==="clinic"||tags.amenity==="doctors"||tags.healthcare==="clinic"||tags.healthcare==="doctor") return "診療所・クリニック";
  if(tags.amenity==="hospital"||tags.healthcare==="hospital") return "病院";
  if(tags.amenity==="pharmacy"||tags.healthcare==="pharmacy") return "薬局";
  return "施設";
}

async function searchImportantFacilities(q){
  const safe=escapeRegExp(q.trim()).replace(/\\ /g,".*");
  if(!safe) return [];
  const query=`[out:json][timeout:12];area["name"="福島県"]["boundary"="administrative"]["admin_level"="4"]->.a;(nwr(area.a)["name"~"${safe}",i]["amenity"~"^(fire_station|police|clinic|doctors|hospital|pharmacy)$"];nwr(area.a)["name"~"${safe}",i]["healthcare"~"^(clinic|doctor|hospital|pharmacy)$"];);out center tags 30;`;
  try{
    const r=await fetch("https://overpass-api.de/api/interpreter",{
      method:"POST",
      headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
      body:"data="+encodeURIComponent(query)
    });
    if(!r.ok) throw 0;
    const j=await r.json();
    return (j.elements||[]).map(e=>{
      const lat=Number(e.lat??e.center?.lat),lon=Number(e.lon??e.center?.lon),t=e.tags||{};
      const addr=[t["addr:province"]||"福島県",t["addr:city"],t["addr:suburb"],t["addr:quarter"],t["addr:street"],t["addr:housenumber"]].filter(Boolean).join("");
      return {lat:String(lat),lon:String(lon),name:t.name||q,namedetails:{name:t.name||q},display_name:[t.name,importantCategoryLabel(t),addr].filter(Boolean).join(" ・ "),address:{state:"福島県"},_source:"overpass",_priority:0};
    }).filter(x=>inFukushimaBounds(Number(x.lat),Number(x.lon)));
  }catch(e){
    return [];
  }
}

async function searchKnownSpecialPlaces(q){
  const nq=normalizePlaceText(q);
  const matched=IMPORTANT_SPECIAL_PLACES.filter(p=>p.aliases.some(a=>{
    const na=normalizePlaceText(a);
    return na===nq||na.includes(nq)||nq.includes(na);
  }));
  const out=[];
  for(const p of matched){
    try{
      const r=await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(p.address)}`);
      if(!r.ok) continue;
      const j=await r.json();
      const c=j?.[0]?.geometry?.coordinates||[];
      const lon=Number(c[0]),lat=Number(c[1]);
      if(inFukushimaBounds(lat,lon)) out.push({lat:String(lat),lon:String(lon),name:p.name,namedetails:{name:p.name},display_name:`${p.name} ・ ${p.address}`,address:{state:"福島県"},_source:"special",_priority:-1});
    }catch(e){}
  }
  return out;
}

searchAddress=async function(){
  const q=addressInput.value.trim(),box=searchCandidates;
  if(!q){alert("福島県内の住所、建物、消防署、警察、診療所などを入力してください。");return}
  addressBtn.disabled=true;
  status.textContent="福島県内を検索中…";
  box.style.display="none";
  try{
    const nq=q.includes("福島県")?q:`福島県 ${q}`;
    const [special,important,n1,n2,g]=await Promise.allSettled([
      searchKnownSpecialPlaces(q),
      searchImportantFacilities(q),
      nominatimSearch(nq),
      nominatimSearch(q),
      gsiSearch(q)
    ]);
    const merged=[];
    for(const r of [special,important,n1,n2,g]) if(r.status==="fulfilled") merged.push(...r.value);
    const seen=new Set();
    const qq=normalizePlaceText(q);
    const ranked=merged.filter(x=>{
      const k=candidateKey(x);
      if(seen.has(k))return false;
      seen.add(k);return true;
    }).sort((a,b)=>{
      const ap=a._priority??1,bp=b._priority??1;
      if(ap!==bp)return ap-bp;
      const an=normalizePlaceText(a.namedetails?.name||a.name||""),bn=normalizePlaceText(b.namedetails?.name||b.name||"");
      const as=an===qq?0:an.includes(qq)?1:2,bs=bn===qq?0:bn.includes(qq)?1:2;
      return as-bs;
    }).slice(0,12);
    if(!ranked.length){
      status.textContent="福島県内に該当地点が見つかりません。住所を詳しくするか、施設の正式名称で検索してください。";
      return;
    }
    box.innerHTML=ranked.map((x,i)=>`<div class="candidate" data-candidate="${i}"><div class="ctitle">${x.namedetails?.name||x.name||(x.display_name||"").split(",")[0]}</div><div class="cmeta">${x.display_name||"福島県"}</div></div>`).join("");
    box.style.display="block";
    status.textContent=`福島県内で${ranked.length}件の候補が見つかりました。`;
    box.querySelectorAll(".candidate").forEach(el=>el.onclick=()=>{
      const hit=ranked[Number(el.dataset.candidate)],lat=Number(hit.lat),lng=Number(hit.lon),title=hit.namedetails?.name||hit.name||(hit.display_name||"").split(",")[0]||q;
      if(!inFukushimaBounds(lat,lng)){status.textContent="福島県外の候補は設定できません。";return}
      setIncident(lat,lng);map.setView([lat,lng],15);
      incidentText.innerHTML=`<b>${title}</b><br>${hit.display_name||"福島県"}<br>緯度 ${lat.toFixed(5)} / 経度 ${lng.toFixed(5)}`;
      addressInput.value=title;box.style.display="none";status.textContent="発災地点を設定しました。";
    });
  }catch(e){
    status.textContent="地点検索に失敗しました。";
  }finally{
    addressBtn.disabled=false;
  }
};
addressBtn.onclick=searchAddress;
