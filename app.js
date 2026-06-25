const VERSION = 'GAME ROOM v1008';
const app = document.getElementById('app');
const storage={get(k,d=null){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))},remove(k){localStorage.removeItem(k)}};
const countries={PL:'Polska (PL)',DE:'Niemcy (DE)',NL:'Holandia (NL)',GB:'Wielka Brytania (GB)',FR:'Francja (FR)',ES:'Hiszpania (ES)',IT:'Włochy (IT)'};
function digits(n=6){return Array.from({length:n},()=>Math.floor(Math.random()*10)).join('')}
function id(code='PL'){return code+digits(6)}
function roomCode(){return 'KR'+Math.floor(1000+Math.random()*9000)}
function profile(){return storage.get('gr_profile')}
function recentRooms(){return storage.get('gr_recent_rooms',[])}
function addRecent(r){const arr=recentRooms().filter(x=>x.code!==r.code);arr.unshift(r);storage.set('gr_recent_rooms',arr.slice(0,3))}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.querySelector('.screen')?.appendChild(t);setTimeout(()=>t.remove(),2400)}
function version(){return `<div class="version">${VERSION}</div>`}
function renderLogin(){const p=profile();app.innerHTML=`<section class="screen login">
<input class="hot" id="loginId" autocomplete="username" value="${p?.playerId||''}" placeholder="NR GRACZA" />
<input class="hot" id="loginPin" type="password" inputmode="numeric" maxlength="4" autocomplete="current-password" placeholder="PIN" />
<button class="btn" id="loginBtn">ZALOGUJ</button><button class="btn" id="createProfileBtn">UTWÓRZ PROFIL</button><button class="btn" id="helpBtn">POMOC</button>${version()}</section>`;
document.getElementById('createProfileBtn').onclick=renderProfile;
document.getElementById('helpBtn').onclick=()=>toast('Wpisz nr gracza i PIN albo utwórz nowy profil.');
document.getElementById('loginBtn').onclick=()=>{const pid=document.getElementById('loginId').value.trim().toUpperCase();const pin=document.getElementById('loginPin').value.trim();const p=profile();if(!p)return toast('Najpierw utwórz profil.');if(pid!==p.playerId||pin!==p.pin)return toast('Zły numer gracza lub PIN.');storage.set('gr_logged_in',true);renderRooms()};}
function renderProfile(){let currentId=id('PL');app.innerHTML=`<section class="screen profile"><button class="btn back" id="backBtn">COFNIJ</button>
<select class="hot countrySelect" id="country"><option value="PL">Polska (PL)</option><option value="DE">Niemcy (DE)</option><option value="NL">Holandia (NL)</option><option value="GB">Wielka Brytania (GB)</option><option value="FR">Francja (FR)</option><option value="ES">Hiszpania (ES)</option><option value="IT">Włochy (IT)</option></select>
<div class="playerText" id="playerText">${currentId}</div><input class="hot nameInput" id="name" maxlength="20" placeholder="Imię / nick" />
<input class="hot pin1" maxlength="1" inputmode="numeric"><input class="hot pin2" maxlength="1" inputmode="numeric"><input class="hot pin3" maxlength="1" inputmode="numeric"><input class="hot pin4" maxlength="1" inputmode="numeric"><button class="btn saveProfile" id="saveBtn">ZAPISZ PROFIL</button>${version()}</section>`;
const c=document.getElementById('country');c.onchange=()=>{currentId=id(c.value);document.getElementById('playerText').textContent=currentId};
[...document.querySelectorAll('.pin1,.pin2,.pin3,.pin4')].forEach((el,i,arr)=>el.oninput=()=>{el.value=el.value.replace(/\D/g,'').slice(0,1);if(el.value&&arr[i+1])arr[i+1].focus()});
document.getElementById('backBtn').onclick=renderLogin;document.getElementById('saveBtn').onclick=()=>{const name=document.getElementById('name').value.trim();const pin=[...document.querySelectorAll('.pin1,.pin2,.pin3,.pin4')].map(x=>x.value).join('');if(name.length<2)return toast('Wpisz imię lub nick.');if(pin.length!==4)return toast('PIN musi mieć 4 cyfry.');storage.set('gr_profile',{playerId:currentId,countryCode:c.value,country:countries[c.value],name,pin,createdAt:Date.now()});toast('Profil zapisany.');setTimeout(renderLogin,700)};}
function renderRooms(){const p=profile();if(!p)return renderLogin();app.innerHTML=`<section class="screen rooms"><button class="btn" id="createRoomBtn">UTWÓRZ POKÓJ</button><input class="hot" id="joinCode" placeholder="KOD POKOJU"><button class="btn" id="joinRoomBtn">DOŁĄCZ</button><button class="recentBtn r1" data-i="0">recent1</button><button class="recentBtn r2" data-i="1">recent2</button><button class="recentBtn r3" data-i="2">recent3</button><button class="btn" id="logoutBtn">WYLOGUJ</button>${version()}</section>`;
document.getElementById('createRoomBtn').onclick=()=>{const code=roomCode();addRecent({code,name:'Kapslarze',lastPlayed:'teraz'});toast('Utworzono pokój '+code+'. Ekran pokoju dodamy w następnej wersji.')};
document.getElementById('joinRoomBtn').onclick=()=>{const code=document.getElementById('joinCode').value.trim().toUpperCase();if(!code)return toast('Wpisz kod pokoju.');addRecent({code,name:'Pokój znajomych',lastPlayed:'teraz'});toast('Dołączanie do pokoju '+code)};
document.querySelectorAll('.recentBtn').forEach(b=>b.onclick=()=>{const r=recentRooms()[Number(b.dataset.i)];if(r)toast('Dołączanie do '+r.code);else toast('Brak zapisanego pokoju w tym miejscu.')});
document.getElementById('logoutBtn').onclick=()=>{storage.remove('gr_logged_in');renderLogin()};}
function init(){if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});storage.get('gr_logged_in')&&profile()?renderRooms():renderLogin()}init();
