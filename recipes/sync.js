// Cross-device sync: everything in S is saved under a private sync code on the server.
// Each device merges its copy with the server copy, so nothing is lost when a device joins.
var SK="recipe-box-sync",code=null,snap=null,syncT=null,syncing=false,again=false,syncMsg="",lastOk=0;
try{code=localStorage.getItem(SK)}catch(e){}
function smeta(s){s.rt=s.rt||{};s.del=s.del||{};s.pt=s.pt||0;s.seen=s.seen||[];s.plan=s.plan||[];s.shop=s.shop||{};s.R=s.R||[];return s}
function srt(o){var r={};Object.keys(o).sort().forEach(function(k){r[k]=o[k]});return r}
function canon(s){s=smeta(s);return JSON.stringify({R:s.R,rt:srt(s.rt),del:srt(s.del),seen:s.seen.slice().sort(),pt:s.pt,plan:s.plan,shop:srt(s.shop)})}
function take(){var m={};S.R.forEach(function(r){m[r.id]=JSON.stringify(r)});return{r:m,p:JSON.stringify([S.plan,S.shop])}}
// Stamp what changed since the last save so merges know which copy is newer.
function stamp(){smeta(S);var n=take(),now=Date.now();if(snap){Object.keys(n.r).forEach(function(id){if(n.r[id]!==snap.r[id])S.rt[id]=now});Object.keys(snap.r).forEach(function(id){if(!(id in n.r))S.del[id]=now});if(n.p!==snap.p)S.pt=now}snap=n}
function merge(a,b){a=smeta(a);b=smeta(b);var o={R:[],rt:{},del:{},seen:[],pt:Math.max(a.pt,b.pt)},pick={},ids=[];
[a,b].forEach(function(s){Object.keys(s.rt).forEach(function(k){o.rt[k]=Math.max(o.rt[k]||0,s.rt[k])});Object.keys(s.del).forEach(function(k){o.del[k]=Math.max(o.del[k]||0,s.del[k])});s.seen.forEach(function(k){if(o.seen.indexOf(k)<0)o.seen.push(k)})});
b.R.forEach(function(r){if(!a.R.some(function(x){return x.id===r.id}))ids.push(r.id)});a.R.forEach(function(r){ids.push(r.id)});
[a,b].forEach(function(s){s.R.forEach(function(r){var t=s.rt[r.id]||0,c=pick[r.id];if(!c||t>c.t)pick[r.id]={r:r,t:t}})});
ids.forEach(function(id){var c=pick[id];if((o.del[id]||0)>c.t)return;o.R.push(c.r)});
var w=b.pt>a.pt?b:a;o.plan=w.plan.filter(function(id){return o.R.some(function(r){return r.id===id})});o.shop=w.shop;return o}
function apply(m){S=m;shop=S.shop;snap=take();save0();if(view!=="new"&&view!=="edit")draw()}
function sync(){if(!code)return Promise.resolve();if(syncing){again=true;return Promise.resolve()}syncing=true;clearTimeout(syncT);
var u="/api/sync?code="+code;
return fetch(u,{cache:"no-store"}).then(function(r){if(r.status===404)return null;if(!r.ok)throw 0;return r.json()}).then(function(remote){
var mine=canon(S),m=remote?merge(S,remote):smeta(S),out=canon(m);
if(out!==mine)apply(m);
if(remote&&out===canon(remote))return;
return fetch(u,{method:"PUT",headers:{"content-type":"application/json"},body:out}).then(function(r){if(!r.ok)throw 0})
}).then(function(){lastOk=Date.now();syncMsg=""},function(){syncMsg="Couldn’t reach the sync server. Your changes are saved here and will sync when you’re back online."}).then(function(){syncing=false;if(view==="sync")draw();if(again){again=false;sync()}})}
var save0=save;save=function(){stamp();save0();if(code){clearTimeout(syncT);syncT=setTimeout(sync,800)}};
function newCode(){var a="abcdefghjkmnpqrstuvwxyz23456789",s="";var v=new Uint32Array(12);crypto.getRandomValues(v);for(var i=0;i<12;i++)s+=a[v[i]%a.length];return s}
function setCode(c){code=c;try{if(c)localStorage.setItem(SK,c);else localStorage.removeItem(SK)}catch(e){}}
function syncOn(){setCode(newCode());draw();sync()}
function syncJoin(c){c=String(c||"").toLowerCase().replace(/[^a-z0-9]/g,"");if(c.length<10){alert("That code looks too short. Check it and try again.");return}setCode(c);draw();sync()}
function syncOff(){if(!confirm("Stop syncing on this device? Your recipes stay here, but changes won’t reach your other devices."))return;setCode(null);draw()}
function syncLink(){return location.origin+"/recipes/#sync="+code}
function shareLink(){var l=syncLink();if(navigator.share){navigator.share({title:"Recipe Box sync",url:l}).catch(function(){});return}
if(navigator.clipboard)navigator.clipboard.writeText(l).then(function(){alert("Link copied. Open it on your other device.")},function(){prompt("Copy this link:",l)});else prompt("Copy this link:",l)}
function syncv(){var h=nav()+'<h1>Sync devices</h1>';
if(!code)return h+'<p>Keep your recipes, this week’s plan and shopping list the same on your iPad, phone and computer.</p><p><button class="btn" onclick="syncOn()">Turn on sync</button></p><h2>Already turned on sync on another device?</h2><p class="mute">Open the sync link from that device, or type its code here.</p><div class="row"><input id="sc" placeholder="Sync code" autocapitalize="off" autocomplete="off" spellcheck="false"><button class="btn" onclick="syncJoin(document.getElementById(&quot;sc&quot;).value)">Join</button></div>';
var st=syncMsg?'<p class="mute">'+esc(syncMsg)+'</p>':syncing&&!lastOk?'<p class="mute">Syncing…</p>':lastOk?'<p class="mute">Last synced at '+new Date(lastOk).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})+'.</p>':"";
return h+'<p>Sync is on for this device. Your sync code is <b>'+esc(code)+'</b>.</p>'+st+'<p>To add another device, open this link on it:</p><p><button class="btn" onclick="shareLink()">Share sync link</button></p><p class="mute">Anyone with this link or code can see and change your Recipe Box, so only share it with your own devices or family.</p><p><button class="ghost" onclick="sync()">Sync now</button> <button class="ghost" onclick="syncOff()">Stop syncing on this device</button></p>'}
function fromHash(){var m=location.hash.match(/sync=([a-z0-9]+)/i);if(!m)return false;history.replaceState(null,"",location.pathname+location.search);if(m[1].toLowerCase()===code)return false;setCode(m[1].toLowerCase());view="sync";draw();return true}
(function(){fromHash();snap=take();if(code)sync();
window.addEventListener("hashchange",function(){if(fromHash())sync()});
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")sync()});
setInterval(function(){if(document.visibilityState==="visible")sync()},30000)})();
