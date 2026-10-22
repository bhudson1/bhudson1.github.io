/* Vancouver scenario viewer — edit the SCENARIO_RULE below to define your own combinations. */
const $ = id => document.getElementById(id);
const EMPTY = {type:'FeatureCollection',features:[]};
let allFeatures = EMPTY;
let mapReady = false;
const map = new maplibregl.Map({
  container:'map',
  style:'https://tiles.openfreemap.org/styles/positron',
  center:[-123.119,49.2705],zoom:12.4,pitch:58,bearing:-23,antialias:true,
  maxPitch:80
});
map.addControl(new maplibregl.NavigationControl({showCompass:true}),'top-left');
map.addControl(new maplibregl.ScaleControl({maxWidth:120,unit:'metric'}),'bottom-right');
function updateStatus(msg){$('map-status').textContent=msg;$('map-status').style.display=msg?'block':'none';}
function getSettings(){return {A:$('optionA').checked,B:$('optionB').checked,C:$('optionC').checked,height:+$('height').value/100,threshold:+$('threshold').value};}
// Each feature can specify the toggle requirements in properties.requires, for example
// {"A":true,"B":false}. Unspecified options are ignored.
// Optional properties: "height_m":50 and "score":3.5.
function matches(feature,s){
  const p=feature.properties||{};
  const req=p.requires||{};
  return ['A','B','C'].every(k=>req[k]===undefined || req[k]===s[k]) && Number(p.score??5)>=s.threshold;
}
function updateScene(){
  const s=getSettings();
  $('heightValue').textContent=Math.round(s.height*100)+'%';
  $('thresholdValue').textContent=s.threshold.toFixed(1);
  $('combination').textContent=['A','B','C'].map(k=>`${k}=${s[k]?'Yes':'No'}`).join(' · ');
  const features=allFeatures.features.filter(f=>matches(f,s));
  $('count').textContent=features.length+' features';
  if(mapReady){
    map.getSource('scenarios').setData({type:'FeatureCollection',features});
    // Height is controlled via a map expression, allowing the slider to scale every building.
    map.setPaintProperty('scenario-massing','fill-extrusion-height',['*',['coalesce',['to-number',['get','height_m']],30],s.height]);
  }
}
function fitScenarios(){
  const features=allFeatures.features.filter(f=>matches(f,getSettings()));
  const pts=[];
  function walk(v){if(typeof v?.[0]==='number')pts.push(v);else if(Array.isArray(v))v.forEach(walk);}
  features.forEach(f=>walk(f.geometry?.coordinates));
  if(!pts.length){map.flyTo({center:[-123.119,49.2705],zoom:12.4});return;}
  const bounds=new maplibregl.LngLatBounds(pts[0],pts[0]);pts.forEach(p=>bounds.extend(p));
  map.fitBounds(bounds,{padding:85,maxZoom:15.5,duration:800,pitch:57});
}
['optionA','optionB','optionC','height','threshold'].forEach(id=>$(id).addEventListener('input',updateScene));
$('reset').addEventListener('click',()=>{$('optionA').checked=true;$('optionB').checked=false;$('optionC').checked=true;$('height').value=100;$('threshold').value=1;updateScene();});
$('fit').addEventListener('click',fitScenarios);
map.on('load',async()=>{
  mapReady=true;
  try{
    // Optional 3D basemap buildings; map style/source IDs can vary.
    const style=map.getStyle();
    const sourceId=Object.keys(style.sources).find(k=>style.sources[k].type==='vector' && /openmaptiles|openfreemap/i.test(k));
    if(sourceId){
      const before=(style.layers||[]).find(l=>l.type==='symbol')?.id;
      map.addLayer({id:'context-buildings',type:'fill-extrusion',source:sourceId,'source-layer':'building',minzoom:14,
        paint:{'fill-extrusion-color':'#b1bdc4','fill-extrusion-opacity':0.45,
          'fill-extrusion-height':['coalesce',['to-number',['get','render_height']],['to-number',['get','height']],0],
          'fill-extrusion-base':['coalesce',['to-number',['get','render_min_height']],0]}},before);
    }
  }catch(e){console.info('Basemap does not expose building heights:',e.message);}
  map.addSource('scenarios',{type:'geojson',data:EMPTY});
  map.addLayer({id:'scenario-massing',type:'fill-extrusion',source:'scenarios',paint:{
    'fill-extrusion-color':['coalesce',['get','color'],'#16a08c'],
    'fill-extrusion-height':['coalesce',['to-number',['get','height_m']],30],
    'fill-extrusion-base':0,'fill-extrusion-opacity':0.84}});
  map.on('click','scenario-massing',e=>{
    const p=e.features?.[0]?.properties||{};
    new maplibregl.Popup().setLngLat(e.lngLat).setHTML(`<b>${escapeHTML(p.name||'Scenario building')}</b><p>Base height: ${Number(p.height_m||30).toFixed(0)} m<br>Score: ${Number(p.score||0).toFixed(1)}</p>`).addTo(map);
  });
  map.on('mouseenter','scenario-massing',()=>map.getCanvas().style.cursor='pointer');
  map.on('mouseleave','scenario-massing',()=>map.getCanvas().style.cursor='');
  try{
    const resp=await fetch('./data/scenarios.geojson',{cache:'no-store'});
    if(!resp.ok)throw new Error(`HTTP ${resp.status}`);
    const geojson=await resp.json();
    if(geojson.type!=='FeatureCollection'||!Array.isArray(geojson.features))throw new Error('Expected a GeoJSON FeatureCollection');
    allFeatures=geojson;
    $('sourceNote').textContent=`Loaded ${allFeatures.features.length} example features. Filters update immediately.`;
    updateScene();
  }catch(e){updateStatus('Could not load scenario GeoJSON: '+e.message);$('sourceNote').textContent='Data failed to load; run a local HTTP server.';}
});
map.on('error',e=>{console.warn('Map error:',e.error);});
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
