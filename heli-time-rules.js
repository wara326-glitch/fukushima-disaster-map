// 空路搬送時間の補正ルール
// 病院直接: 飛行時間 + 固定加算 + 院内移送2分
// 近隣ヘリポート: 飛行時間 + 固定加算 + 地上移送（30km/h換算 + 3分、最低5分）
Object.assign(HELIPORTS,{
  "総合南東北病院":{type:"onsite",place:"施設内ヘリポート",km:0.1,transfer:"院内搬送"},
  "星総合病院":{type:"onsite",place:"屋上ヘリポート",km:0.1,transfer:"院内搬送"},
  "福島赤十字病院":{type:"onsite",place:"病院直接",km:0.1,transfer:"院内ストレッチャー"},
  "会津中央病院":{type:"onsite",place:"敷地内ヘリポート",km:0.3,transfer:"院内救急車"},
  "いわき市医療センター":{type:"onsite",place:"病院直接",km:0.1,transfer:"院内ストレッチャー"},
  "白河厚生総合病院":{type:"onsite",place:"敷地内ヘリポート",km:0.2,transfer:"院内救急車又は消防署救急車"},
  "大原綜合病院":{type:"onsite",place:"屋上ヘリポート",km:0.1,transfer:"院内搬送"},
  "福島県立医科大学附属病院":{type:"onsite",place:"敷地内ヘリポート",km:0.5,transfer:"院内患者搬送車又は消防署救急車"},
  "福島県立医科大学会津医療センター附属病院":{type:"onsite",place:"病院直接",km:0.1,transfer:"院内搬送"},
  "ふたば医療センター附属病院":{type:"onsite",place:"施設内ヘリポート",km:0.1,transfer:"院内搬送"},
  "太田西ノ内病院":{type:"offsite",place:"郡山河川防災ステーション",km:5.0,transfer:"院内救急車"},
  "南相馬市立総合病院":{type:"offsite",place:"萱浜ニュースポーツ広場",km:0.7,transfer:"救急車搬送"}
});

heliLabel=function(h){
  const x=heliInfo(h);
  if(!x) return "🚁 離着陸場所 要確認";
  if(x.type==="onsite") return "🚁 病院直接";
  if(x.type==="adjacent") return "🚁 病院場外";
  return `🚁 近隣 ${x.km}km`;
};

heliTransferMinutes=function(h){
  const x=heliInfo(h);
  if(!x) return null;
  if(x.type==="onsite"||x.type==="adjacent") return 2;
  return Math.max(5,Math.round(x.km/30*60)+3);
};

airMinutes=function(km,h){
  if(km==null) return null;
  const transfer=heliTransferMinutes(h);
  if(transfer==null) return null;
  const flight=km/(Number(airSpeed.value)||220)*60;
  return flight+(Number(airOverhead.value)||0)+transfer;
};

renderResults();
