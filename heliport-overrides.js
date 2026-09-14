// Hospital-specific heliport corrections supplied/confirmed for this map.
HELIPORTS["総合南東北病院"]={
  type:"onsite",
  place:"敷地内ヘリポート",
  km:0,
  transfer:"院内搬送"
};

// Refresh list/markers after applying overrides.
try{renderResults();drawHospitals();}catch(e){}
