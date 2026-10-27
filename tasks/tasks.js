// Tasks: recurring tasks and reminders, laid out like Todoist.
// Everything is saved on this device; the sync section at the bottom keeps other devices in step.
var KEY="tasks-v1",S={T:[],P:[],H:[],del:{},hc:0},view="today",vp="",q="",qa={},cur=null,toastT=null,lastDay="";
var DAYS=["sun","mon","tue","wed","thu","fri","sat"],DN=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],MON=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
var PC={1:"#d1453b",2:"#eb8909",3:"#246fe0",4:"#9a9a9a"},COL=["#2e7d4a","#246fe0","#eb8909","#b8255f","#8e44ad","#14a3a3","#d1453b","#7a5c3a"];
var REM=[["","No reminder"],["0","At due time (9 AM if no time)"],["10","10 minutes before"],["30","30 minutes before"],["60","1 hour before"],["1440","1 day before"]];
var I={inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
up:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
rep:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
check:'<path d="M20 6 9 17l-5-5"/>',done:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',plus:'<path d="M12 5v14M5 12h14"/>',
menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
sync:'<path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M3 21v-5h5"/>',
flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',more:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
back:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',goal:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',imp:'<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',book:'<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>'};
function ic(p,s){s=s||18;return'<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
function flag(p,s){return'<svg width="'+(s||16)+'" height="'+(s||16)+'" viewBox="0 0 24 24" fill="'+(p<4?PC[p]:"none")+'" stroke="'+PC[p]+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I.flag+'</svg>'}
function todayIcon(){return'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I.cal+'<text x="12" y="19" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">'+new Date().getDate()+'</text></svg>'}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function uid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

// Dates are local "YYYY-MM-DD" keys so they compare as strings.
function p2(n){return(n<10?"0":"")+n}
function dk(d){return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate())}
function kd(k){var a=k.split("-");return new Date(+a[0],a[1]-1,+a[2])}
function today(){return dk(new Date())}
function addD(k,n){var d=kd(k);d.setDate(d.getDate()+n);return dk(d)}
function addM(k,n,dom){var d=kd(k),y=d.getFullYear(),m=d.getMonth()+n,last=new Date(y,m+1,0).getDate();return dk(new Date(y,m,Math.min(dom||d.getDate(),last)))}
function dow(k){return kd(k).getDay()}
function ord(n){var s=n%100>10&&n%100<14?"th":["th","st","nd","rd"][n%10]||"th";return n+s}
function dlabel(k){var t=today();if(k===t)return"Today";if(k===addD(t,1))return"Tomorrow";if(k===addD(t,-1))return"Yesterday";
var d=kd(k),diff=Math.round((d-kd(t))/864e5);if(diff>1&&diff<7)return DN[d.getDay()];
return d.toLocaleDateString([],{month:"short",day:"numeric",year:d.getFullYear()!==new Date().getFullYear()?"numeric":undefined})}
function dlong(k){var d=kd(k),l=dlabel(k),s=d.toLocaleDateString([],{month:"short",day:"numeric"});return s+(l===DN[d.getDay()]||/\d/.test(l)?" · "+DN[d.getDay()]:" · "+l+" · "+DN[d.getDay()])}
function tlabel(t){var a=t.split(":"),d=new Date(2000,0,1,+a[0],+a[1]);return d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}).replace(":00","")}

// Repeats: {n, u: day|week|month|year, days: [0-6] for weekly, dom: day of month, x: dom was typed}.
function step(k,r){if(r.u==="day")return addD(k,r.n);
if(r.u==="week"){if(r.days&&r.days.length&&!(r.days.length===1&&r.n>1)){for(var i=1;i<=7;i++){var x=addD(k,i);if(r.days.indexOf(dow(x))>-1)return x}}return addD(k,7*r.n)}
return addM(k,(r.u==="month"?1:12)*r.n,r.dom)}
function firstOn(r,from){if(r.u==="week"&&r.days&&r.days.length){for(var i=0;i<7;i++){var x=addD(from,i);if(r.days.indexOf(dow(x))>-1)return x}}
if(r.u==="month"&&r.dom){var d=kd(from),c=addM(dk(new Date(d.getFullYear(),d.getMonth(),1)),0,r.dom);return c>=from?c:addM(c,1,r.dom)}return from}
function mon1(d){return(d+6)%7}
// Weekly goals ({u:"goal", n}) have no fixed days: the task stays in Today until it's been done n times this week.
function wk0(k){var i=0;while(dow(addD(k,-i))!==1)i++;return addD(k,-i)}
function gcount(t,k){var a=kd(wk0(k||today())).getTime(),b=kd(addD(wk0(k||today()),7)).getTime();return S.H.filter(function(h){return h.id===t.id&&h.at>=a&&h.at<b}).length}
function goalDue(t){var tk=today();return gcount(t)>=t.r.n?addD(wk0(tk),7):tk}
function goals(){S.T.forEach(function(t){if(!t.done&&t.r&&t.r.u==="goal"){var d=goalDue(t);if(t.d!==d)t.d=d}})}
function rtext(r){if(!r)return"";var U=r.u;if(U==="goal")return r.n===1?"once a week":r.n===2?"twice a week":r.n+" times a week";
if(U==="week"&&r.days&&r.days.length){var s=r.days.slice().sort(function(a,b){return mon1(a)-mon1(b)}),j=s.slice().sort().join("");
if(r.n===1&&j==="12345")return"every weekday";if(r.n===1&&j==="06")return"every weekend";
return"every "+(r.n>1?r.n+" weeks on ":"")+s.map(function(d){return DN[d]}).join(", ")}
if(U==="month"&&r.x)return"every "+(r.n>1?r.n+" months on the ":"")+ord(r.dom);
if(r.n===1)return{day:"every day",week:"every week",month:"every month",year:"every year"}[U];return"every "+r.n+" "+U+"s"}

// Quick add understands dates, times, repeats, p1-p4 and #Project typed into the task name, like Todoist.
var WD="(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|wed|thurs|thur|thu|fri|sat)",MO="(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
function wdn(s){return DAYS.indexOf(s.toLowerCase().slice(0,3))}
function nlp(s){var o={t:" "+s+" ",d:"",tm:"",r:null,p:0,pj:"",hit:[]},t=today();
function cut(re,f){o.t=o.t.replace(re,function(){var a=[].slice.call(arguments);if(f.apply(null,a)===false)return a[0];o.hit.push(a[0].trim());return" "})}
function rep(r){if(o.r)return false;o.r=r}
cut(/\b(?:(\d+)\s*(?:x|times?)|(once|twice))\s*(?:a|per|each|every|\/)\s*week\b/i,function(m,n,w){n=n?+n:w.toLowerCase()==="once"?1:2;if(n<1||n>21)return false;return rep({n:n,u:"goal"})});
cut(/\bevery\s+(weekday|workday)s?\b/i,function(){return rep({n:1,u:"week",days:[1,2,3,4,5]})});
cut(/\bevery\s+weekends?\b/i,function(){return rep({n:1,u:"week",days:[0,6]})});
cut(new RegExp("\\b(?:every|each)\\s+(other\\s+|\\d+\\s+weeks?\\s+on\\s+)?("+WD+"(?:\\s*(?:,|and|&)\\s*"+WD+")*)\\b","i"),function(m,n,l){var d=[];l.split(/\s*(?:,|and|&)\s*/i).forEach(function(x){var i=wdn(x);if(i>-1&&d.indexOf(i)<0)d.push(i)});return rep({n:n?(parseInt(n,10)||2):1,u:"week",days:d})});
cut(/\bevery\s+(\d+)\s+months\s+on\s+the\s+(\d{1,2})(?:st|nd|rd|th)\b/i,function(m,n,d){d=+d;if(d<1||d>31)return false;return rep({n:+n||1,u:"month",dom:d,x:1})});
cut(/\bevery\s+(\d{1,2})(?:st|nd|rd|th)\b/i,function(m,n){n=+n;if(n<1||n>31)return false;return rep({n:1,u:"month",dom:n,x:1})});
cut(/\b(?:every|each)\s+(other\s+|\d+\s+)?(day|week|month|year)s?\b/i,function(m,n,u){return rep({n:n?(parseInt(n,10)||2):1,u:u.toLowerCase()})});
cut(/\b(daily|weekly|monthly|yearly|annually)\b/i,function(m,w){w=w.toLowerCase();return rep({n:1,u:{daily:"day",weekly:"week",monthly:"month",yearly:"year",annually:"year"}[w]})});
function tm(h,mi){if(o.tm||h>23||mi>59)return false;o.tm=p2(h)+":"+p2(mi)}
cut(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,function(m,h,mi,ap){h=+h;if(h<1||h>12)return false;if(/^p/i.test(ap)&&h<12)h+=12;if(/^a/i.test(ap)&&h===12)h=0;return tm(h,+(mi||0))});
cut(/\b(?:at\s+)?noon\b/i,function(){return tm(12,0)});
cut(/\b(?:at\s+)?(\d{1,2}):(\d{2})\b/,function(m,h,mi){return tm(+h,+mi)});
function dt(k){if(o.d)return false;o.d=k}
cut(/\b(today|tod|tonight)\b/i,function(){return dt(t)});
cut(/\b(tomorrow|tmrw|tmr)\b/i,function(){return dt(addD(t,1))});
cut(/\bnext\s+week\b/i,function(){var i=1;while(dow(addD(t,i))!==1)i++;return dt(addD(t,i))});
cut(/\b(?:this\s+)?weekend\b/i,function(){var i=0;while(dow(addD(t,i))!==6)i++;return dt(addD(t,i))});
cut(/\bin\s+(\d+|a|an|one|two|three)\s+(day|week|month)s?\b/i,function(m,n,u){n={a:1,an:1,one:1,two:2,three:3}[n.toLowerCase()]||+n;u=u.toLowerCase();return dt(u==="month"?addM(t,n):addD(t,u==="week"?7*n:n))});
cut(new RegExp("\\b(?:(next|on|this)\\s+"+WD+"|(sunday|monday|tuesday|wednesday|thursday|friday|saturday|tues|tue|thurs|thur|thu|fri))\\b","i"),function(m,w,a,b){var i=wdn(a||b),j=w&&/next/i.test(w)?1:0;while(dow(addD(t,j))!==i)j++;return dt(addD(t,j))});
function md(m,d,y){var yr=y?(+y<100?2000+ +y:+y):new Date().getFullYear(),x=new Date(yr,m,d);if(x.getMonth()!==m)return false;var k=dk(x);if(!y&&k<t)k=dk(new Date(yr+1,m,d));return dt(k)}
cut(new RegExp("\\b"+MO+"\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b","i"),function(m,mo,d,y){return md(MON.indexOf(mo.toLowerCase().slice(0,3)),+d,y)});
cut(new RegExp("\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+"+MO+"(?:\\s+(\\d{4}))?\\b","i"),function(m,d,mo,y){return md(MON.indexOf(mo.toLowerCase().slice(0,3)),+d,y)});
cut(/\b(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?\b/,function(m,y,mo,d,h,mi){if(o.d||md(+mo-1,+d,y)===false)return false;if(h&&!o.tm&&+h<24&&+mi<60)o.tm=h+":"+mi});
cut(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?\b/,function(m,mo,d,y){return md(+mo-1,+d,y)});
cut(/\s[pP]([1-4])(?=\s)/,function(m,p){if(o.p)return false;o.p=+p});
cut(/\s#([^\s#]+)(?=\s)/,function(m,n){if(o.pj)return false;o.pj=n});
o.t=o.t.replace(/\s+/g," ").trim();
if(o.r&&!o.d)o.d=firstOn(o.r,t);if(o.tm&&!o.d)o.d=t;
if(o.r&&(o.r.u==="month"||o.r.u==="year")&&!o.r.dom)o.r.dom=kd(o.d).getDate();
return o}
function parseRepeat(s){s=String(s||"").trim();if(!s)return null;var o=nlp(/^(every|each|daily|weekly|monthly|yearly|annually)\b/i.test(s)?s:"every "+s);return o.r||undefined}

// Data helpers
function load(){try{var d=JSON.parse(localStorage.getItem(KEY)||"null");if(d&&Array.isArray(d.T))S=d}catch(e){}norm(S)}
function norm(s){s.T=s.T||[];s.P=s.P||[];s.H=s.H||[];s.del=s.del||{};s.hc=s.hc||0;return s}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){alert("Couldn’t save on this device. Storage may be full.")}}
function save(){stamp();persist();if(code){clearTimeout(syncT);syncT=setTimeout(sync,800)}}
function task(id){return S.T.find(function(x){return x.id===id})}
function proj(id){return S.P.find(function(x){return x.id===id})}
function pname(id){var p=proj(id);return p?p.name:"Inbox"}
function open(){return S.T.filter(function(x){return!x.done})}
function cmp(a,b){var x=(a.d||"9999")+(a.tm||"99:99"),y=(b.d||"9999")+(b.tm||"99:99");return x<y?-1:x>y?1:(a.p-b.p)||(a.c-b.c)}
function byc(a,b){return a.c-b.c}
function projFor(name){var n=name.toLowerCase().replace(/[\s_-]/g,"");if(n==="inbox")return"inbox";
var p=S.P.find(function(x){return x.name.toLowerCase().replace(/[\s_-]/g,"")===n});if(p)return p.id;
p={id:uid("p"),name:name.replace(/[_-]/g," "),color:COL[S.P.length%COL.length],c:Date.now()};S.P.push(p);return p.id}

// Layout
function go(v,p){view=v;vp=p||"";if(v!=="search"){q=""}side(0);draw();window.scrollTo(0,0)}
function side(o){document.body.classList.toggle("so",!!o)}
function drawSide(){var a=document.activeElement;if(!a||a.id!=="sq")document.getElementById("side").innerHTML=sideHtml()}
function draw(){goals();drawSide();document.getElementById("app").innerHTML=mainHtml();lastDay=today()}
function sideHtml(){var c={inbox:0,today:0},t=today();open().forEach(function(x){c[x.pj]=(c[x.pj]||0)+1;if(x.d&&x.d<=t)c.today++});
function it(v,p,icon,label,n){var on=view===v&&vp===(p||"");return'<button class="nv'+(on?" on":"")+'" onclick="go(\''+v+'\',\''+(p||"")+'\')"'+(on?' aria-current="page"':"")+'>'+icon+'<span>'+label+'</span>'+(n?'<em>'+n+'</em>':"")+'</button>'}
return'<a class="home" href="/">'+ic(I.back,15)+'Walden &amp; Finch</a><button class="addb" onclick="side(0);quick()"><span class="plus">'+ic(I.plus,15)+'</span>Add task</button>'
+'<label class="srch">'+ic(I.search,17)+'<input id="sq" type="search" placeholder="Search" aria-label="Search tasks" value="'+esc(q)+'" oninput="q=this.value;view=q?\'search\':\'today\';vp=\'\';document.getElementById(\'app\').innerHTML=mainHtml()" onblur="setTimeout(drawSide,250)"></label>'
+it("inbox","",ic(I.inbox),"Inbox",c.inbox)+it("today","",todayIcon(),"Today",c.today)+it("upcoming","",ic(I.up),"Upcoming")+it("goals","",ic(I.goal),"Weekly goals")+it("done","",ic(I.done),"Completed")
+'<div class="sh"><span>My projects</span><button class="ib" aria-label="Add project" onclick="addProj()">'+ic(I.plus,16)+'</button></div>'
+S.P.slice().sort(byc).map(function(p){return it("project",p.id,'<i class="dot" style="background:'+p.color+'"></i>',esc(p.name),c[p.id])}).join("")
+(S.P.length?"":'<p class="mute" style="padding:0 8px;margin:4px 0;font-size:.85rem">Add one with + or type #Name in a task.</p>')
+'<div class="sbot">'+it("reminders","",ic(I.bell),"Reminders")+it("sync","",ic(I.sync),"Sync devices")+it("import","",ic(I.imp),"Import from Todoist")+'<a class="nv" href="/recipes/">'+ic(I.book)+'<span>Recipe Box</span></a></div>'}
function head(title,extra){return'<header class="top"><button class="ib mob" aria-label="Open menu" onclick="side(1)">'+ic(I.menu,22)+'</button><h1>'+title+'</h1>'+(extra||"")+'</header>'}
function mainHtml(){return view==="inbox"?listv("inbox","Inbox"):view==="project"?(proj(vp)?listv(vp,esc(pname(vp))):(view="today",todayv())):view==="upcoming"?upv():view==="done"?donev():view==="goals"?goalv():view==="search"?searchv():view==="sync"?syncv():view==="reminders"?remv():view==="import"?impv():todayv()}
function row(t,o){o=o||{};var tk=today(),m=[];
if(t.d&&!(t.r&&t.r.u==="goal")){var cls=t.d<tk?"od":t.d===tk?"td":t.d===addD(tk,1)?"tm":t.d<=addD(tk,6)?"wk":"",lb=[o.noDate?"":dlabel(t.d),t.tm?tlabel(t.tm):""].filter(Boolean).join(" ");
if(lb||(t.r&&t.r.u!=="goal"))m.push('<span class="due '+cls+'">'+(lb?ic(I.cal,12)+lb:"")+(t.r&&t.r.u!=="goal"?" "+ic(I.rep,12):"")+'</span>')}
if(t.r&&t.r.u==="goal"){var gc=gcount(t);m.push('<span class="goal'+(gc>=t.r.n?" met":"")+'">'+ic(gc>=t.r.n?I.check:I.rep,12)+'Done '+gc+' of '+t.r.n+' this week</span>')}
if(t.d&&t.rem!=null)m.push('<span title="Reminder">'+ic(I.bell,12)+'</span>');
if(o.pj){var p=proj(t.pj);m.push('<span class="pjn">'+esc(pname(t.pj))+(p?'<i class="dot" style="background:'+p.color+';width:8px;height:8px;margin-right:0"></i>':ic(I.inbox,12))+'</span>')}
var met=t.r&&t.r.u==="goal"&&gcount(t)>=t.r.n;return'<div class="task" id="t'+t.id+'"><button class="ck'+(met?" on":"")+'" data-p="'+t.p+'" aria-label="Complete: '+esc(t.t)+'" onclick="complete(\''+t.id+'\')">'+ic(I.check,12)+'</button><button class="tb" onclick="edit(\''+t.id+'\')"><span class="tt">'+esc(t.t)+'</span>'+(t.n?'<span class="tn">'+esc(t.n.split("\n")[0])+'</span>':"")+(m.length?'<span class="meta">'+m.join("")+'</span>':"")+'</button></div>'}
function rows(l,o){return l.map(function(t){return row(t,o)}).join("")}
function sec(title,l,right,o){return'<section><h2 class="sec">'+title+(right||"")+'</h2>'+rows(l,o)+'</section>'}
function addRow(pre){return'<button class="addrow" onclick="quick({d:\''+(pre.d||"")+'\',pj:\''+(pre.pj||"")+'\'})">'+ic(I.plus,18)+'Add task</button>'}
function empty(b,s){return'<div class="empty"><b>'+b+'</b>'+s+'</div>'}
function todayv(){var t=today(),o=open(),od=o.filter(function(x){return x.d&&x.d<t}).sort(cmp),td=o.filter(function(x){return x.d===t}).sort(cmp),n=od.length+td.length;
var h=head("Today",n?'<span class="sub">'+n+' task'+(n>1?"s":"")+'</span>':"");
if(od.length)h+=sec('<span class="od">Overdue</span>',od,'<button class="lnk" onclick="resched()">Reschedule to today</button>',{pj:1});
h+=sec(dlong(t),td,"",{pj:1,noDate:1})+addRow({d:t});
if(!n)h+=empty("Nothing due today. Enjoy your day.","Tap + to add a task. Try “Water plants every Sunday” or “Pay rent every 1st”.");return h}
function upv(){var t=today(),o=open().filter(function(x){return x.d}),od=o.filter(function(x){return x.d<t}).sort(cmp),h=head("Upcoming");
if(od.length)h+=sec('<span class="od">Overdue</span>',od,'<button class="lnk" onclick="resched()">Reschedule to today</button>',{pj:1});
for(var i=0;i<7;i++){var k=addD(t,i);h+=sec(dlong(k),o.filter(function(x){return x.d===k}).sort(cmp),"",{pj:1,noDate:1})+addRow({d:k})}
var later=o.filter(function(x){return x.d>addD(t,6)}).sort(cmp),seen={};
later.forEach(function(x){if(seen[x.d])return;seen[x.d]=1;h+=sec(dlong(x.d),later.filter(function(y){return y.d===x.d}),"",{pj:1,noDate:1})});return h}
function listv(pj,title){var l=open().filter(function(x){return x.pj===pj}).sort(cmp),more=pj==="inbox"?"":'<button class="ib" aria-label="Project options" onclick="projMenu()">'+ic(I.more,20)+'</button>';
return head(title,more)+'<section>'+rows(l)+'</section>'+addRow({pj:pj})+(l.length?"":empty(pj==="inbox"?"Your inbox is clear.":"No tasks here yet.",pj==="inbox"?"New tasks land here unless you pick a project.":"Add one, or type #"+esc(pname(pj).replace(/\s+/g,""))+" in any task."))}
function searchv(){var s=q.toLowerCase(),l=S.T.filter(function(x){return(x.t+" "+(x.n||"")).toLowerCase().indexOf(s)>-1}).sort(cmp);
return head("Search")+'<p class="mute">'+l.length+' result'+(l.length===1?"":"s")+' for “'+esc(q)+'”</p>'+l.map(function(t){return t.done?'<div class="task done"><button class="ck on" aria-label="Mark not done: '+esc(t.t)+'" onclick="reopen(\''+t.id+'\')">'+ic(I.check,12)+'</button><button class="tb" onclick="edit(\''+t.id+'\')"><span class="tt">'+esc(t.t)+'</span></button></div>':row(t,{pj:1})}).join("")}
function goalv(){var l=open().filter(function(t){return t.r&&t.r.u==="goal"}).sort(byc),h=head("Weekly goals");
h+='<p class="mute">Things to do a set number of times each week, on any days. Tap one to change its goal.</p>';
h+=l.map(function(t){var c=gcount(t),pc=Math.min(100,Math.round(100*c/t.r.n));return row(t)+'<div class="bar1" role="img" aria-label="'+c+' of '+t.r.n+' done this week"><i style="width:'+pc+'%"></i></div>'}).join("");
return h+'<button class="addrow" onclick="quick({},\' 3 times a week\')">'+ic(I.plus,18)+'Add weekly goal</button>'+(l.length?"":empty("No weekly goals yet.","Add one, like “Weight training 3 times a week”."))}
function donev(){var h=head("Completed"),l=S.H.filter(function(x){return x.at>S.hc}),days={},keys=[];
l.forEach(function(x){var k=dk(new Date(x.at));if(!days[k]){days[k]=[];keys.push(k)}days[k].push(x)});
if(!l.length)return h+empty("No completed tasks yet.","Tasks you check off show up here.");
keys.forEach(function(k){h+='<section><h2 class="sec">'+dlong(k)+'</h2>'+days[k].map(function(x){var t=task(x.id),can=t&&t.done;
return'<div class="task done"><button class="ck on" data-p="'+(t?t.p:4)+'" '+(can?'aria-label="Mark not done: '+esc(x.t)+'" onclick="reopen(\''+x.id+'\')"':'disabled aria-label="Completed"')+'>'+ic(I.check,12)+'</button><div class="tb" style="cursor:default"><span class="tt">'+esc(x.t)+'</span><span class="meta"><span>'+new Date(x.at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})+'</span>'+(x.r?'<span>'+ic(I.rep,12)+' repeating</span>':"")+'<span class="pjn">'+esc(pname(x.pj))+'</span></span></div></div>'}).join("")+'</section>'});
return h+'<p style="margin-top:20px"><button class="ghost" onclick="clearDone()">Clear completed history</button></p>'}

// Actions
function complete(id){var t=task(id);if(!t)return;var before=JSON.stringify(t),now=Date.now(),hk={id:t.id,t:t.t,at:now,pj:t.pj,r:t.r?1:0};S.H.unshift(hk);
var el=document.getElementById("t"+id),stay=view==="goals"&&t.r&&t.r.u==="goal";if(el){el.querySelector(".ck").classList.add("on");if(!stay)el.classList.add("gone")}
var msg;if(t.r&&t.r.u==="goal"){var gc=gcount(t);t.d=goalDue(t);msg=gc+" of "+t.r.n+" this week"+(gc>=t.r.n?". Goal met! Back on Monday.":"")}
else if(t.r&&t.d){var n=step(t.d,t.r),tk=today(),g=0;while(n<tk&&g++<2000)n=step(n,t.r);t.d=n;msg="Done. Next: "+dlabel(n)+(t.tm?" "+tlabel(t.tm):"")}
else{t.done=true;t.dt=now;msg="1 task completed"}
save();setTimeout(draw,el?260:0);
toast(msg,function(){var i=S.T.indexOf(task(id));if(i>-1)S.T[i]=JSON.parse(before);S.H=S.H.filter(function(x){return x!==hk});S.del["h:"+hk.id+"@"+hk.at]=Date.now();save();draw()})}
function reopen(id){var t=task(id);if(!t)return;t.done=false;delete t.dt;save();draw();toast("Task restored")}
function resched(){var t=today(),l=open().filter(function(x){return x.d&&x.d<t});l.forEach(function(x){x.d=t});save();draw();toast(l.length+" task"+(l.length>1?"s":"")+" moved to today")}
function clearDone(){if(!confirm("Clear your completed history? Finished one-time tasks are deleted too."))return;S.hc=Date.now();S.T=S.T.filter(function(x){return!x.done});S.H=[];save();draw()}
function addProj(){var n=prompt("Project name");if(!n||!n.trim())return;var id=projFor(n.trim());save();go("project",id)}
function projMenu(){var p=proj(vp);if(!p)return;modal('<div class="list"><button class="nv" onclick="renProj()">Rename project</button><button class="nv" style="color:var(--od)" onclick="delProj()">Delete project</button><button class="nv" onclick="closeM()">Cancel</button></div>',"Project options")}
function renProj(){var p=proj(vp),n=prompt("Rename project",p.name);closeM();if(!n||!n.trim())return;p.name=n.trim();save();draw()}
function delProj(){var p=proj(vp),l=S.T.filter(function(x){return x.pj===p.id});closeM();if(!confirm("Delete “"+p.name+"”"+(l.length?" and its "+l.length+" task"+(l.length>1?"s":""):"")+"?"))return;
S.T=S.T.filter(function(x){return x.pj!==p.id});S.P=S.P.filter(function(x){return x!==p});save();go("inbox")}

// Dialogs
function modal(h,label){document.getElementById("modal").innerHTML='<div class="mb" onclick="if(event.target===this)closeM()"><div class="dlg" role="dialog" aria-modal="true" aria-label="'+esc(label)+'">'+h+'</div></div>'}
function closeM(){document.getElementById("modal").innerHTML="";cur=null}
function opts(list,val){return list.map(function(o){return'<option value="'+esc(o[0])+'"'+(String(o[0])===String(val)?" selected":"")+'>'+esc(o[1])+'</option>'}).join("")}
function projOpts(val){return opts([["inbox","Inbox"]].concat(S.P.slice().sort(byc).map(function(p){return[p.id,p.name]})),val)}
function quick(pre,fill){pre=pre||{};qa={d:pre.d||(view==="today"?today():""),pj:pre.pj||(view==="project"||view==="inbox"?vp||"inbox":"inbox")};
modal('<form onsubmit="event.preventDefault();qadd()"><input id="qi" class="qi" placeholder="e.g. Trash every Tue 8pm" autocomplete="off" enterkeyhint="done" oninput="qprev()"><textarea id="qn" class="qn" rows="1" placeholder="Description"></textarea><div id="qp" class="chips"></div><div class="bar"><input id="qd" type="date" aria-label="Due date" value="'+qa.d+'" onchange="qprev()"><select id="qpj" aria-label="Project">'+projOpts(qa.pj)+'</select><span class="sp"></span><button type="button" class="ghost" onclick="closeM()">Cancel</button><button class="btn" id="qb" disabled>Add task</button></div><p class="hint">Type it naturally: tomorrow, fri 5pm, Nov 3, every weekday, every 2 weeks, every 1st, p1 for priority, #Errands for a project.</p></form>',"Add task");
var qi=document.getElementById("qi");if(fill)qi.value=fill;qprev();qi.focus();if(fill)qi.setSelectionRange(0,0)}
function qprev(){var v=document.getElementById("qi").value,o=nlp(v),c=[],d=o.d||document.getElementById("qd").value;
if(d)c.push(ic(I.cal,13)+dlabel(d)+(o.tm?" "+tlabel(o.tm):""));if(o.r)c.push(ic(I.rep,13)+rtext(o.r));if(o.p)c.push(flag(o.p,13)+"P"+o.p);if(o.pj)c.push("#"+esc(o.pj));
document.getElementById("qp").innerHTML=c.map(function(x){return'<span class="chip hl">'+x+'</span>'}).join("");document.getElementById("qb").disabled=!o.t}
function qadd(){var e=document.getElementById("qi"),o=nlp(e.value);if(!o.t)return;
var pj=o.pj?projFor(o.pj):document.getElementById("qpj").value,d=o.d||document.getElementById("qd").value||"";
var t={id:uid("t"),t:o.t,n:document.getElementById("qn").value.trim(),d:d,tm:o.tm,r:o.r,p:o.p||4,pj:pj,rem:o.tm?0:null,c:Date.now()};
S.T.push(t);save();draw();e.value="";document.getElementById("qn").value="";
document.getElementById("qpj").innerHTML=projOpts(qa.pj);qprev();e.focus();toast("Added to "+(d?dlabel(d):pname(pj)))}
function edit(id){var t=task(id);if(!t)return;cur=id;var tk=today(),nw=addD(tk,1);while(dow(nw)!==1)nw=addD(nw,1);var we=tk;while(dow(we)!==6)we=addD(we,1);
var pr=[1,2,3,4].map(function(p){return'<label><input type="radio" name="pr" value="'+p+'"'+(t.p===p?" checked":"")+'><span>'+flag(p,14)+'P'+p+'</span></label>'}).join("");
modal('<form onsubmit="event.preventDefault();saveEd()"><div class="edtop"><button type="button" class="ck" data-p="'+t.p+'" aria-label="Complete" onclick="var i=cur;closeM();complete(i)">'+ic(I.check,12)+'</button><div style="flex:1"><input id="et" class="qi" value="'+esc(t.t)+'" aria-label="Task name"><textarea id="en" class="qn" rows="2" placeholder="Description">'+esc(t.n||"")+'</textarea></div></div>'
+'<div class="fld"><label>Date<input id="ed" type="date" value="'+esc(t.d)+'"></label><label>Time<input id="em" type="time" value="'+esc(t.tm)+'"></label>'
+'<div class="full chips" style="margin:0">'+[["Today",tk],["Tomorrow",addD(tk,1)],["This weekend",we],["Next week",nw],["No date",""]].map(function(x){return'<button type="button" class="chip" onclick="document.getElementById(\'ed\').value=\''+x[1]+'\'">'+x[0]+'</button>'}).join("")+'</div>'
+'<label class="full">Repeat<input id="er" list="rl" placeholder="Doesn’t repeat" value="'+esc(rtext(t.r))+'" oninput="rprev()" autocomplete="off"><span id="erp" class="hint" style="margin:0;font-weight:400"></span></label><div class="full wdays" role="group" aria-label="Repeat on these days every week">'+[1,2,3,4,5,6,0].map(function(d){return'<button type="button" class="wd" data-d="'+d+'" aria-pressed="false" aria-label="'+DN[d]+'" onclick="pickDay('+d+')">'+DN[d].slice(0,3)+'</button>'}).join("")+'</div>'+(t.r&&t.r.u==="goal"?'<p class="full hint" style="margin:-4px 0 0">This week: '+gcount(t)+' of '+t.r.n+' · Last week: '+gcount(t,addD(tk,-7))+'</p>':"")+'<datalist id="rl">'+["every day","every weekday","every week","every 2 weeks","every month","every 3 months","every year","3 times a week","every Monday","every Saturday, Sunday"].map(function(x){return'<option value="'+x+'">'}).join("")+'</datalist>'
+'<div class="full"><label>Priority</label><div class="pri" style="margin-top:4px">'+pr+'</div></div>'
+'<label>Project<select id="ep">'+projOpts(t.pj)+'</select></label><label>Reminder<select id="ea">'+opts(REM,t.rem==null?"":t.rem)+'</select></label></div>'
+'<div class="bar"><button type="button" class="ghost danger" onclick="delTask()">Delete</button><span class="sp"></span><button type="button" class="ghost" onclick="closeM()">Cancel</button><button class="btn">Save</button></div></form>',"Edit task");rprev()}
// Weekday buttons write the repeat text, e.g. "every Monday, Wednesday", so typing and tapping stay in step.
function pickDay(d){var r=parseRepeat(document.getElementById("er").value),days=r&&r.u==="week"&&r.days&&r.n===1?r.days.slice():[],i=days.indexOf(d);if(i>-1)days.splice(i,1);else days.push(d);
document.getElementById("er").value=days.length?rtext({n:1,u:"week",days:days}):"";rprev()}
function rprev(){var e=document.getElementById("er"),r=parseRepeat(e.value),p=document.getElementById("erp");p.textContent=r===undefined?"Not recognized. Try “every Monday” or “every 2 weeks”.":r&&rtext(r).toLowerCase()!==e.value.trim().toLowerCase()?"Repeats "+rtext(r):"";p.style.color=r===undefined?"var(--od)":"";[].forEach.call(document.querySelectorAll(".wd"),function(b){b.setAttribute("aria-pressed",!!(r&&r.u==="week"&&r.days&&r.days.indexOf(+b.dataset.d)>-1))})}
function saveEd(){var t=task(cur);if(!t){closeM();return}var g=function(id){return document.getElementById(id).value},name=g("et").trim();if(!name){document.getElementById("et").focus();return}
var r=parseRepeat(g("er"));if(r===undefined){document.getElementById("er").focus();return}
var d=g("ed"),tm=g("em");if(r&&!d)d=firstOn(r,today());if(r&&d&&r.u==="week"&&r.days&&r.days.length&&r.days.indexOf(dow(d))<0)d=firstOn(r,d);if(r&&(r.u==="month"||r.u==="year")&&!r.x)r.dom=kd(d).getDate();
var rem=g("ea");t.t=name;t.n=g("en").trim();t.d=d;t.tm=d?tm:"";t.r=d?r:null;t.p=+(document.querySelector("input[name=pr]:checked")||{value:4}).value;t.pj=g("ep");t.rem=rem===""?null:+rem;
closeM();save();draw()}
function delTask(){var t=task(cur);if(!t)return;var i=S.T.indexOf(t);S.T.splice(i,1);closeM();save();draw();toast("Task deleted",function(){S.T.splice(i,0,t);save();draw()})}
function toast(m,undo){var e=document.getElementById("toast");clearTimeout(toastT);e.innerHTML='<span>'+esc(m)+'</span>'+(undo?'<button id="undo">Undo</button>':"");e.className="show";
if(undo)document.getElementById("undo").onclick=function(){e.className="";undo()};toastT=setTimeout(function(){e.className=""},5000)}
document.addEventListener("keydown",function(e){var tg=e.target.tagName;if(e.key==="Escape"){if(document.getElementById("modal").innerHTML)closeM();else side(0)}
else if((e.key==="q"||e.key==="a")&&!e.metaKey&&!e.ctrlKey&&!/INPUT|TEXTAREA|SELECT/.test(tg)&&!document.getElementById("modal").innerHTML){e.preventDefault();quick()}});

// Reminders: alerts fire while this page is open; the Calendar feed covers when it is closed.
var FK="tasks-fired";
function remAt(t){if(t.done||!t.d||t.rem==null)return 0;var d=kd(t.d);if(t.tm){var a=t.tm.split(":");d.setHours(+a[0],+a[1])}else d.setHours(9,0);return d.getTime()-t.rem*6e4}
function checkRem(){var f={},now=Date.now(),ch=false;try{f=JSON.parse(localStorage.getItem(FK)||"{}")}catch(e){}
S.T.forEach(function(t){var at=remAt(t),k=t.id+"@"+t.d+t.tm+"@"+t.rem;if(at&&at<=now&&now-at<36e5&&at>=(t.u||t.c||0)-6e4&&!f[k]){f[k]=now;ch=true;alertTask(t)}});
Object.keys(f).forEach(function(k){if(now-f[k]>2*864e5){delete f[k];ch=true}});if(ch)try{localStorage.setItem(FK,JSON.stringify(f))}catch(e){}
if(today()!==lastDay)draw()}
function alertTask(t){var w=(t.d===today()?"Today":dlabel(t.d))+(t.tm?" at "+tlabel(t.tm):"");
try{if(window.Notification&&Notification.permission==="granted")new Notification(t.t,{body:w,tag:t.id,icon:"/assets/logo-black.png"})}catch(e){}
toast("⏰ "+t.t+" · "+w);try{navigator.vibrate&&navigator.vibrate(200)}catch(e){}}
function askNotify(){if(!window.Notification)return;Notification.requestPermission().then(function(){draw()})}
function calLink(){return"webcal://"+location.host+"/api/tasks-cal?code="+code}
function copyCal(){var l="https://"+location.host+"/api/tasks-cal?code="+code;if(navigator.clipboard)navigator.clipboard.writeText(l).then(function(){toast("Calendar link copied")},function(){prompt("Copy this link:",l)});else prompt("Copy this link:",l)}
function remv(){var h=head("Reminders")+'<div class="prose"><p>Set a reminder on any task by opening it. Tasks with a time get one automatically.</p><h2 class="sec">On your iPhone and iPad</h2>';
if(!code)h+='<p>To get alerts even when this page is closed, your tasks need to be in Calendar. That uses sync, so turn it on first.</p><p><button class="btn" onclick="syncOn()">Turn on sync</button></p>';
else h+='<p>Add your tasks to the Calendar app and its alerts will remind you, even when this page is closed. Repeating tasks repeat there too.</p><p><a class="btn" href="'+calLink()+'">Add to Calendar</a></p><p class="mute">Tap it, then Subscribe. If alerts don’t show, find the Tasks subscription in your Calendar settings and turn off Remove Alerts. For Google Calendar, <button class="lnk" onclick="copyCal()">copy the link</button> and add it under Other calendars, From URL.</p>';
h+='<h2 class="sec">In this browser</h2>';
if(!window.Notification)h+='<p class="mute">Reminders pop up here while the page is open.</p>';
else if(Notification.permission==="granted")h+='<p>Notifications are on. Reminders pop up while this page is open in a tab.</p>';
else if(Notification.permission==="denied")h+='<p class="mute">Notifications are blocked for this site in your browser settings. Reminders still pop up on the page while it’s open.</p>';
else h+='<p>Get a notification when a reminder is due while this page is open in a tab.</p><p><button class="btn" onclick="askNotify()">Allow notifications</button></p>';
return h+'</div>'}

// Import from Todoist: a backup .zip (one CSV per project) or project CSVs exported as templates.
function impv(){return head("Import from Todoist")+'<div class="prose"><p><b>Easiest:</b> on todoist.com, open Settings, then Backups, and download the latest backup. Choose that .zip file below.</p><p class="mute">No backups listed? Open each project in Todoist, choose ⋯, Export as template, then Export as file. You can pick several CSV files at once.</p><p><label class="btn" style="cursor:pointer">Choose Todoist file<input type="file" accept=".zip,.csv,application/zip,text/csv" multiple hidden onchange="importFiles(this)"></label></p><p class="mute">Projects, due dates, times, repeats, priorities and descriptions come across. Tasks you already have here aren’t added twice.</p></div>'}
function importFiles(inp){var fs=[].slice.call(inp.files);inp.value="";if(!fs.length)return;toast("Importing…");
Promise.all(fs.map(function(f){return f.arrayBuffer().then(function(b){var u=new Uint8Array(b);return u[0]===80&&u[1]===75?unzip(b):[{name:f.name,text:new TextDecoder().decode(u)}]})})).then(function(l){
var files=[].concat.apply([],l).filter(function(x){return/\.csv$/i.test(x.name)}),n={t:0,p:0,s:0};if(!files.length)throw 0;files.forEach(function(f){impCsv(f,n)});if(!n.t&&!n.s)throw 0;save();go("today");
toast("Imported "+n.t+" task"+(n.t===1?"":"s")+(n.p?" and "+n.p+" project"+(n.p===1?"":"s"):"")+(n.s?". Skipped "+n.s+" you already had.":""))}).catch(function(){alert("That doesn’t look like a Todoist backup or CSV export.")})}
// Minimal zip reader; Todoist backups use plain or deflate-compressed entries.
function unzip(buf){var v=new DataView(buf),u=new Uint8Array(buf),i=buf.byteLength-22,td=new TextDecoder();while(i>=0&&v.getUint32(i,true)!==0x06054b50)i--;if(i<0)return Promise.reject(0);
var n=v.getUint16(i+10,true),p=v.getUint32(i+16,true),out=[];
for(var k=0;k<n;k++){var m=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),fl=v.getUint16(p+28,true),xl=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),off=v.getUint32(p+42,true),name=td.decode(u.subarray(p+46,p+46+fl)),st=off+30+v.getUint16(off+26,true)+v.getUint16(off+28,true);
out.push({name:name,m:m,data:u.slice(st,st+cs)});p+=46+fl+xl+cl}
return Promise.all(out.filter(function(f){return/\.csv$/i.test(f.name)}).map(function(f){var b=f.m===0?Promise.resolve(f.data.buffer):new Response(new Blob([f.data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer();
return b.then(function(x){return{name:f.name,text:td.decode(x)}})}))}
function csv(s){s=s.replace(/^﻿/,"");var rows=[],row=[],f="",q=false;for(var i=0;i<s.length;i++){var c=s[i];
if(q){if(c==='"'){if(s[i+1]==='"'){f+='"';i++}else q=false}else f+=c}else if(c==='"')q=true;else if(c===","){row.push(f);f=""}
else if(c==="\n"||c==="\r"){if(c==="\r"&&s[i+1]==="\n")i++;row.push(f);rows.push(row);row=[];f=""}else f+=c}if(f||row.length){row.push(f);rows.push(row)}return rows}
// Todoist file names end in an id like "[6Jf8VQXx]"; early imports kept it in the project name.
var TID=/\s*\[[A-Za-z0-9_-]+\]$/;
function tidy(){var ch=false;S.P.slice().forEach(function(p){if(!TID.test(p.name))return;var n=p.name.replace(TID,"").trim()||"Imported";ch=true;
if(/^inbox$/i.test(n)){S.T.forEach(function(t){if(t.pj===p.id)t.pj="inbox"});S.P.splice(S.P.indexOf(p),1);if(vp===p.id){view="inbox";vp=""}}else p.name=n});if(ch)save();return ch}
function impCsv(f,n){var r=csv(f.text),h=(r[0]||[]).map(function(x){return x.trim().toUpperCase()}),c=function(k){return h.indexOf(k)};if(c("TYPE")<0||c("CONTENT")<0)return;
var name=f.name.split("/").pop().replace(/\.csv$/i,"").replace(TID,"").trim()||"Imported",pj="inbox",last=null,g=function(row,k){return c(k)>-1?(row[c(k)]||"").trim():""};
if(!/^inbox$/i.test(name)){var had=S.P.length;pj=projFor(name);if(S.P.length>had)n.p++}
r.slice(1).forEach(function(row,i){var ty=g(row,"TYPE").toLowerCase(),t=g(row,"CONTENT").replace(/^\*\s+/,"");
if(ty==="note"&&last&&t){last.n=(last.n?last.n+"\n":"")+t;return}if(ty!=="task"||!t)return;
if(S.T.some(function(x){return!x.done&&x.pj===pj&&x.t===t})){n.s++;last=null;return}
var ds=g(row,"DATE"),o=ds?nlp(ds.replace(/every!/ig,"every")):{d:"",tm:"",r:null},nt=g(row,"DESCRIPTION");
if(/\bevery\b/i.test(ds)&&!o.r)nt=(nt?nt+"\n":"")+"Todoist repeat: "+ds;
var p=+g(row,"PRIORITY");last={id:uid("t"),t:t,n:nt,d:o.d||"",tm:o.tm||"",r:o.r||null,p:p>=1&&p<=4?p:4,pj:pj,rem:o.tm?0:null,c:Date.now()+i};S.T.push(last);n.t++})}

// Sync uses the same private code as the Recipe Box, so a device synced there is synced here too.
var SK="recipe-box-sync",code=null,snap=null,syncT=null,syncing=false,again=false,syncMsg="",lastOk=0,pulled=false,joining=null,afterSync="sync";
try{code=localStorage.getItem(SK)}catch(e){}
function items(s){return s.T.concat(s.P)}
function take(){var m={};items(S).forEach(function(x){var c=Object.assign({},x);delete c.u;m[x.id]=JSON.stringify(c)});return m}
// Stamp what changed since the last save so merges know which copy is newer.
function stamp(){var n=take(),now=Date.now();if(snap){items(S).forEach(function(x){if(n[x.id]!==snap[x.id])x.u=now});Object.keys(snap).forEach(function(id){if(!(id in n))S.del[id]=now})}snap=n}
function mlist(a,b,del){var pick={},ids=[];a.concat(b).forEach(function(x){var c=pick[x.id];if(!c){ids.push(x.id);pick[x.id]=x}else if((x.u||0)>(c.u||0))pick[x.id]=x});
return ids.map(function(id){return pick[id]}).filter(function(x){return!((del[x.id]||0)>(x.u||0))})}
function merge(a,b){a=norm(a);b=norm(b);var o={del:{},hc:Math.max(a.hc,b.hc)},seen={};
[a,b].forEach(function(s){Object.keys(s.del).forEach(function(k){o.del[k]=Math.max(o.del[k]||0,s.del[k])})});
o.T=mlist(a.T,b.T,o.del);o.P=mlist(a.P,b.P,o.del);
o.H=a.H.concat(b.H).filter(function(h){var k=h.id+"@"+h.at;if(seen[k]||h.at<=o.hc||o.del["h:"+k])return false;seen[k]=1;return true}).sort(hsort).slice(0,500);return o}
function hsort(x,y){return y.at-x.at||(x.id<y.id?-1:x.id>y.id?1:0)}
function srt(o){var r={};Object.keys(o).sort().forEach(function(k){r[k]=o[k]});return r}
function byId(l){return l.slice().sort(function(a,b){return a.id<b.id?-1:1})}
function canon(s){s=norm(s);return JSON.stringify({T:byId(s.T),P:byId(s.P),H:s.H.slice().sort(hsort),del:srt(s.del),hc:s.hc})}
function apply(m){S=m;snap=take();persist();tidy();draw()}
function sync(){if(!code)return Promise.resolve();if(syncing){again=true;return Promise.resolve()}syncing=true;pulled=false;clearTimeout(syncT);if(view==="sync")draw();
var u="/api/tasks-sync?code="+code;
return fetch(u+"&t="+Date.now(),{cache:"no-store"}).then(function(r){if(r.status===404)return null;if(!r.ok)throw 0;return r.json()}).then(function(remote){
var mine=canon(S),m=remote?merge(S,remote):norm(S),out=canon(m);
if(out!==mine){pulled=true;apply(m)}
if(remote&&out===canon(remote))return;
return fetch(u,{method:"PUT",headers:{"content-type":"application/json"},body:out}).then(function(r){if(!r.ok)throw 0})
}).then(function(){lastOk=Date.now();syncMsg=""},function(){syncMsg="Couldn’t reach the sync server. Your changes are saved here and will sync when you’re back online."}).then(function(){syncing=false;if(view==="sync")draw();if(again){again=false;sync()}})}
function newCode(){var a="abcdefghjkmnpqrstuvwxyz23456789",s="",v=new Uint32Array(12);crypto.getRandomValues(v);for(var i=0;i<12;i++)s+=a[v[i]%a.length];return s}
function setCode(c){code=c;try{if(c)localStorage.setItem(SK,c);else localStorage.removeItem(SK)}catch(e){}}
function syncOn(){setCode(newCode());draw();sync()}
function syncJoin(c){c=String(c||"").toLowerCase().replace(/[^a-z0-9]/g,"");if(c.length<10){alert("That code looks too short. Check it and try again.");return}if(c===code){sync();return}syncMsg="";setCode(c);draw();sync()}
function syncOff(){if(!confirm("Stop syncing on this device? Your tasks stay here, but changes won’t reach your other devices. This also stops Recipe Box sync on this device."))return;setCode(null);draw()}
function shareLink(){var l=location.origin+"/tasks/#sync="+code;if(navigator.share){navigator.share({title:"Tasks sync",url:l}).catch(function(){});return}
if(navigator.clipboard)navigator.clipboard.writeText(l).then(function(){toast("Link copied. Open it on your other device.")},function(){prompt("Copy this link:",l)});else prompt("Copy this link:",l)}
function joinBox(t){return'<h2 class="sec">'+t+'</h2><p class="mute">Open the sync link from that device, or type its code here.</p><div class="row"><input id="sc" placeholder="Sync code" autocapitalize="off" autocomplete="off" spellcheck="false" style="flex:1;width:auto"><button class="btn" onclick="syncJoin(document.getElementById(\'sc\').value)">Join</button></div>'}
function syncv(){var h=head("Sync devices")+'<div class="prose">';
if(!code)return h+'<p>Keep your tasks the same on your iPad, iPhone and computer. This uses the same sync code as the Recipe Box.</p><p><button class="btn" onclick="syncOn()">Turn on sync</button></p>'+joinBox("Already syncing on another device?")+'</div>';
var st=syncing?"Syncing…":syncMsg?syncMsg:lastOk?"Synced at "+new Date(lastOk).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})+(pulled?". Updated with changes from your other devices.":". Everything is up to date."):"";
return h+'<p>Sync is on. Your sync code is <b>'+esc(code)+'</b>, shared with your Recipe Box. All your devices should show this same code.</p><p><button class="btn" onclick="sync()"'+(syncing?" disabled":"")+'>'+(syncing?"Syncing…":"Sync now")+'</button></p><p role="status"'+(syncMsg?' style="color:var(--od)"':' class="mute"')+'>'+esc(st)+'</p><p class="mute">On this device: '+open().length+' open tasks, '+S.P.length+' projects.</p><p>To add another device, open this link on it:</p><p><button class="btn" onclick="shareLink()">Share sync link</button></p><p class="mute">Anyone with this link or code can see and change your tasks and recipes, so only share it with your own devices or family.</p><p><button class="ghost" onclick="syncOff()">Stop syncing on this device</button></p>'+joinBox("Different code on your other device?")+'</div>'}
function fromHash(){var m=location.hash.match(/sync=([a-z0-9]+)/i);if(!m)return false;history.replaceState(null,"",location.pathname+location.search);if(m[1].toLowerCase()===code)return false;setCode(m[1].toLowerCase());view="sync";return true}

load();fromHash();snap=take();tidy();draw();if(code)sync();checkRem();
window.addEventListener("hashchange",function(){if(fromHash()){draw();sync()}});
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible"){sync();checkRem()}});
setInterval(function(){if(document.visibilityState==="visible")sync()},30000);setInterval(checkRem,20000);
