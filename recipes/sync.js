// Cross-device sync: everything in S is saved under a private sync code on the server.
// Each device merges its copy with the server copy, so nothing is lost when a device joins.
var SK="recipe-box-sync",pulled=false,joining=null,code=null,snap=null,syncT=null,syncing=false,again=false,syncMsg="",lastOk=0;
try{code=localStorage.getItem(SK)}catch(e){}
function smeta(s){s.rt=s.rt||{};s.del=s.del||{};s.ps=s.ps||{};s.ss=s.ss||{};s.seen=s.seen||[];s.plan=s.plan||[];s.shop=s.shop||{};s.R=s.R||[];return s}
function srt(o){var r={};Object.keys(o).sort().forEach(function(k){r[k]=o[k]});return r}
function canon(s){s=smeta(s);return JSON.stringify({R:s.R,rt:srt(s.rt),del:srt(s.del),seen:s.seen.slice().sort(),ps:srt(s.ps),ss:srt(s.ss),plan:s.plan,shop:srt(on(s.shop))})}
function on(o){var r={};Object.keys(o).forEach(function(k){if(o[k])r[k]=true});return r}
function take(){var m={};S.R.forEach(function(r){m[r.id]=JSON.stringify(r)});return{r:m,plan:S.plan.slice(),shop:on(S.shop)}}
// Stamp what changed since the last save so merges know which copy is newer.
function stamp(){smeta(S);var n=take(),now=Date.now();if(snap){Object.keys(n.r).forEach(function(id){if(n.r[id]!==snap.r[id])S.rt[id]=now});Object.keys(snap.r).forEach(function(id){if(!(id in n.r))S.del[id]=now});// Plan and checkmarks are stamped per item, so an empty list on one device never wipes another.
n.plan.concat(snap.plan).forEach(function(id){if((n.plan.indexOf(id)>-1)!==(snap.plan.indexOf(id)>-1))S.ps[id]=now});
Object.keys(n.shop).concat(Object.keys(snap.shop)).forEach(function(k){if(!n.shop[k]!==!snap.shop[k])S.ss[k]=now})}snap=n}
function pickSet(aHas,bHas,ta,tb){return tb>ta?bHas:ta>tb?aHas:aHas||bHas}
function merge(a,b){a=smeta(a);b=smeta(b);var o={R:[],rt:{},del:{},seen:[],ps:{},ss:{},plan:[],shop:{}},pick={},ids=[];
[a,b].forEach(function(s){Object.keys(s.rt).forEach(function(k){o.rt[k]=Math.max(o.rt[k]||0,s.rt[k])});Object.keys(s.del).forEach(function(k){o.del[k]=Math.max(o.del[k]||0,s.del[k])});s.seen.forEach(function(k){if(o.seen.indexOf(k)<0)o.seen.push(k)})});
b.R.forEach(function(r){if(!a.R.some(function(x){return x.id===r.id}))ids.push(r.id)});a.R.forEach(function(r){ids.push(r.id)});
[a,b].forEach(function(s){s.R.forEach(function(r){var t=s.rt[r.id]||0,c=pick[r.id];if(!c||t>c.t)pick[r.id]={r:r,t:t}})});
ids.forEach(function(id){var c=pick[id];if((o.del[id]||0)>c.t)return;o.R.push(c.r)});
var pid=a.plan.concat(b.plan,Object.keys(a.ps),Object.keys(b.ps));
var pd={};pid.forEach(function(id){if(pd[id])return;pd[id]=1;var ta=a.ps[id]||0,tb=b.ps[id]||0;if(ta||tb)o.ps[id]=Math.max(ta,tb);
if(pickSet(a.plan.indexOf(id)>-1,b.plan.indexOf(id)>-1,ta,tb)&&o.R.some(function(r){return r.id===id}))o.plan.push(id)});
var sk=Object.keys(a.shop).concat(Object.keys(b.shop),Object.keys(a.ss),Object.keys(b.ss)),done={};
sk.forEach(function(k){if(done[k])return;done[k]=1;var ta=a.ss[k]||0,tb=b.ss[k]||0;if(ta||tb)o.ss[k]=Math.max(ta,tb);if(pickSet(!!a.shop[k],!!b.shop[k],ta,tb))o.shop[k]=true});return o}
function apply(m){S=m;shop=S.shop;snap=take();save0();if(view!=="new"&&view!=="edit")draw()}
function sync(){if(!code)return Promise.resolve();if(syncing){again=true;return Promise.resolve()}syncing=true;pulled=false;clearTimeout(syncT);if(view==="sync")draw();
var u="/api/sync?code="+code;
return fetch(u+"&t="+Date.now(),{cache:"no-store"}).then(function(r){if(r.status===404){if(joining!==null){var old=joining;joining=null;setCode(old);syncMsg="No device is using that code yet. Check the code and try again.";throw 1}return null}joining=null;if(!r.ok)throw 0;return r.json()}).then(function(remote){
var mine=canon(S),m=remote?merge(S,remote):smeta(S),out=canon(m);
if(out!==mine){pulled=true;apply(m)}
if(remote&&out===canon(remote))return;
return fetch(u,{method:"PUT",headers:{"content-type":"application/json"},body:out}).then(function(r){if(!r.ok)throw 0})
}).then(function(){lastOk=Date.now();syncMsg=""},function(e){if(e===1)return;syncMsg="Couldn’t reach the sync server. Your changes are saved here and will sync when you’re back online."}).then(function(){syncing=false;if(view==="sync")draw();if(again){again=false;sync()}})}
var save0=save;save=function(){stamp();save0();if(code){clearTimeout(syncT);syncT=setTimeout(sync,800)}};
function newCode(){var a="abcdefghjkmnpqrstuvwxyz23456789",s="";var v=new Uint32Array(12);crypto.getRandomValues(v);for(var i=0;i<12;i++)s+=a[v[i]%a.length];return s}
function setCode(c){code=c;try{if(c)localStorage.setItem(SK,c);else localStorage.removeItem(SK)}catch(e){}}
function syncOn(){setCode(newCode());draw();sync()}
function syncJoin(c){c=String(c||"").toLowerCase().replace(/[^a-z0-9]/g,"");if(c.length<10){alert("That code looks too short. Check it and try again.");return}if(c===code){syncNow();return}joining=code;syncMsg="";setCode(c);draw();sync()}
function syncOff(){if(!confirm("Stop syncing on this device? Your recipes stay here, but changes won’t reach your other devices."))return;setCode(null);draw()}
function syncLink(){return location.origin+"/recipes/#sync="+code}
function shareLink(){var l=syncLink();if(navigator.share){navigator.share({title:"Recipe Box sync",url:l}).catch(function(){});return}
if(navigator.clipboard)navigator.clipboard.writeText(l).then(function(){alert("Link copied. Open it on your other device.")},function(){prompt("Copy this link:",l)});else prompt("Copy this link:",l)}
function syncNow(){syncMsg="";sync()}
function joinBox(t){return'<h2>'+t+'</h2><p class="mute">Open the sync link from that device, or type its code here.</p><div class="row"><input id="sc" placeholder="Sync code" autocapitalize="off" autocomplete="off" spellcheck="false"><button class="btn" onclick="syncJoin(document.getElementById(&quot;sc&quot;).value)">Join</button></div>'}
function syncv(){var h=nav()+'<h1>Sync devices</h1>';
if(!code)return h+'<p>Keep your recipes, this week’s plan and shopping list the same on your iPad, phone and computer.</p><p><button class="btn" onclick="syncOn()">Turn on sync</button></p>'+joinBox("Already turned on sync on another device?");
var st=syncing?'Syncing…':syncMsg?syncMsg:lastOk?'Synced at '+new Date(lastOk).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})+(pulled?'. Updated with changes from your other devices.':'. Everything is up to date.'):"";
var cnt='On this device: '+S.R.length+' recipes, '+S.plan.length+' in this week, '+Object.keys(shop).filter(function(k){return shop[k]}).length+' checked off.';
return h+'<p>Sync is on for this device. Your sync code is <b>'+esc(code)+'</b>. All your devices should show this same code.</p><p><button class="btn" onclick="syncNow()"'+(syncing?" disabled":"")+'>'+(syncing?"Syncing…":"Sync now")+'</button></p><p role="status"'+(syncMsg?' style="color:#b3261e"':' class="mute"')+'>'+esc(st)+'</p><p class="mute">'+cnt+'</p>'+'<p>To add another device, open this link on it:</p><p><button class="btn" onclick="shareLink()">Share sync link</button></p><p class="mute">Anyone with this link or code can see and change your Recipe Box, so only share it with your own devices or family.</p><p><button class="ghost" onclick="syncOff()">Stop syncing on this device</button></p>'+joinBox("Different code on your other device?")}
function fromHash(){var m=location.hash.match(/sync=([a-z0-9]+)/i);if(!m)return false;history.replaceState(null,"",location.pathname+location.search);if(m[1].toLowerCase()===code)return false;setCode(m[1].toLowerCase());view="sync";draw();return true}
(function(){fromHash();snap=take();if(code)sync();
window.addEventListener("hashchange",function(){if(fromHash())sync()});
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")sync()});
setInterval(function(){if(document.visibilityState==="visible")sync()},30000)})();
