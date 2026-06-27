const VERSION = 'GAME ROOM v1031';
const app = document.getElementById('app');
const storage={get(k,d=null){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))},remove(k){localStorage.removeItem(k)}};
const countries={PL:'Polska (PL)',DE:'Niemcy (DE)',NL:'Holandia (NL)',GB:'Wielka Brytania (GB)',FR:'Francja (FR)',ES:'Hiszpania (ES)',IT:'Włochy (IT)',AT:'Austria (AT)',BE:'Belgia (BE)',CH:'Szwajcaria (CH)',SE:'Szwecja (SE)',NO:'Norwegia (NO)',DK:'Dania (DK)',FI:'Finlandia (FI)',IE:'Irlandia (IE)',PT:'Portugalia (PT)',CZ:'Czechy (CZ)',SK:'Słowacja (SK)',HU:'Węgry (HU)',RO:'Rumunia (RO)',BG:'Bułgaria (BG)',GR:'Grecja (GR)',TR:'Turcja (TR)',UA:'Ukraina (UA)',LT:'Litwa (LT)',LV:'Łotwa (LV)',EE:'Estonia (EE)',US:'USA (US)',CA:'Kanada (CA)',BR:'Brazylia (BR)',AR:'Argentyna (AR)',MX:'Meksyk (MX)',AU:'Australia (AU)',JP:'Japonia (JP)',KR:'Korea Południowa (KR)',CN:'Chiny (CN)',IN:'Indie (IN)',ZA:'RPA (ZA)',MA:'Maroko (MA)',EG:'Egipt (EG)'};
function digits(n=6){return Array.from({length:n},()=>Math.floor(Math.random()*10)).join('')}
function id(code='PL'){return code+digits(6)}
function roomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from({length:7},()=>chars[Math.floor(Math.random()*chars.length)]).join('')}
function profile(){return storage.get('gr_profile')}
function recentRooms(){return storage.get('gr_recent_rooms',[])}
function addRecent(r){const arr=recentRooms().filter(x=>x.code!==r.code);arr.unshift(r);storage.set('gr_recent_rooms',arr.slice(0,8))}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.querySelector('.screen')?.appendChild(t);setTimeout(()=>t.remove(),2400)}
function version(){return `<div class="version">${VERSION}</div>`}
function renderLogin(){const p=profile();app.innerHTML=`<section class="screen login">
<input class="hot loginField" id="loginId" autocomplete="username" value="${p?.playerId||''}" placeholder="" />
<input class="hot loginField" id="loginPin" type="password" inputmode="numeric" maxlength="4" autocomplete="current-password" placeholder="" />
<button class="btn" id="loginBtn">ZALOGUJ</button><button class="btn" id="createProfileBtn">UTWÓRZ PROFIL</button><button class="btn" id="helpBtn">POMOC</button>${version()}</section>`;
document.getElementById('createProfileBtn').onclick=renderProfile;
document.getElementById('helpBtn').onclick=()=>toast('Wpisz login/numer i PIN albo utwórz nowy profil.');
document.getElementById('loginBtn').onclick=()=>{const pid=document.getElementById('loginId').value.trim().toUpperCase();const pin=document.getElementById('loginPin').value.trim();const p=profile();if(!p)return toast('Najpierw utwórz profil.');if(pid!==p.playerId||pin!==p.pin)return toast('Zły numer gracza lub PIN.');storage.set('gr_logged_in',true);renderRooms()};}
function renderProfile(){let currentId=id('PL');app.innerHTML=`<section class="screen profile"><button class="btn back" id="backBtn">COFNIJ</button>
<label class="profileLabel countryLabel" for="country">KRAJ</label>
<label class="profileLabel numberLabel">NUMER GRACZA</label>
<label class="profileLabel nameLabel" for="name">IMIĘ / NICK</label>
<label class="profileLabel pinLabel">PIN (4 CYFRY)</label>
<div class="countryDisplay" id="countryDisplay">Polska (PL)</div>
<select class="hot countrySelect" id="country"><option value="PL">Polska (PL)</option><option value="DE">Niemcy (DE)</option><option value="NL">Holandia (NL)</option><option value="GB">Wielka Brytania (GB)</option><option value="FR">Francja (FR)</option><option value="ES">Hiszpania (ES)</option><option value="IT">Włochy (IT)</option><option value="AT">Austria (AT)</option><option value="BE">Belgia (BE)</option><option value="CH">Szwajcaria (CH)</option><option value="SE">Szwecja (SE)</option><option value="NO">Norwegia (NO)</option><option value="DK">Dania (DK)</option><option value="FI">Finlandia (FI)</option><option value="IE">Irlandia (IE)</option><option value="PT">Portugalia (PT)</option><option value="CZ">Czechy (CZ)</option><option value="SK">Słowacja (SK)</option><option value="HU">Węgry (HU)</option><option value="RO">Rumunia (RO)</option><option value="BG">Bułgaria (BG)</option><option value="GR">Grecja (GR)</option><option value="TR">Turcja (TR)</option><option value="UA">Ukraina (UA)</option><option value="LT">Litwa (LT)</option><option value="LV">Łotwa (LV)</option><option value="EE">Estonia (EE)</option><option value="US">USA (US)</option><option value="CA">Kanada (CA)</option><option value="BR">Brazylia (BR)</option><option value="AR">Argentyna (AR)</option><option value="MX">Meksyk (MX)</option><option value="AU">Australia (AU)</option><option value="JP">Japonia (JP)</option><option value="KR">Korea Południowa (KR)</option><option value="CN">Chiny (CN)</option><option value="IN">Indie (IN)</option><option value="ZA">RPA (ZA)</option><option value="MA">Maroko (MA)</option><option value="EG">Egipt (EG)</option></select>
<div class="playerText" id="playerText">${currentId}</div><input class="hot nameInput" id="name" maxlength="20" aria-label="Imię / nick" placeholder="" />
<input class="hot pin1" maxlength="1" inputmode="numeric" aria-label="PIN 1"><input class="hot pin2" maxlength="1" inputmode="numeric" aria-label="PIN 2"><input class="hot pin3" maxlength="1" inputmode="numeric" aria-label="PIN 3"><input class="hot pin4" maxlength="1" inputmode="numeric" aria-label="PIN 4"><button class="btn saveProfile" id="saveBtn">ZAPISZ PROFIL</button>${version()}</section>`;
const c=document.getElementById('country');c.onchange=()=>{currentId=id(c.value);document.getElementById('playerText').textContent=currentId;document.getElementById('countryDisplay').textContent=countries[c.value]};
[...document.querySelectorAll('.pin1,.pin2,.pin3,.pin4')].forEach((el,i,arr)=>el.oninput=()=>{el.value=el.value.replace(/\D/g,'').slice(0,1);if(el.value&&arr[i+1])arr[i+1].focus()});
document.getElementById('backBtn').onclick=renderLogin;document.getElementById('saveBtn').onclick=()=>{const name=document.getElementById('name').value.trim();const pin=[...document.querySelectorAll('.pin1,.pin2,.pin3,.pin4')].map(x=>x.value).join('');if(name.length<2)return toast('Wpisz imię lub nick.');if(pin.length!==4)return toast('PIN musi mieć 4 cyfry.');storage.set('gr_profile',{playerId:currentId,countryCode:c.value,country:countries[c.value],name,pin,createdAt:Date.now()});toast('Profil zapisany.');setTimeout(renderLogin,700)};}
function renderRooms(){
const p=profile();if(!p)return renderLogin();
const rooms=recentRooms();
const newCode=roomCode();
const slotCount=Math.max(4,rooms.length);
const slots=Array.from({length:slotCount},(_,i)=>{
  const r=rooms[i];
  if(!r)return `<div class="roomSlot empty"><div class="slotIcon">♙</div><div class="slotEmptyText">Brak pokoju</div></div>`;
  return `<div class="roomSlot filled"><div class="slotIcon">♙</div><div class="slotInfo"><div class="slotName">${r.name||'Pokój'}</div><div class="slotCode"><span>Kod:</span> ${r.code}</div></div><button class="roomJoin" data-i="${i}">DOŁĄCZ</button></div>`;
}).join('');
app.innerHTML=`<section class="screen rooms">
  <div class="roomGreeting">Witaj,<br><span>${p.name}</span></div>
  <div class="roomPlayerBox"><span>NR GRACZA:</span><strong>${p.playerId}</strong></div>

  <div class="roomsFrame">
    <section class="createPanel">
      <div class="panelIcon">♙ ♙</div>
      <h2>UTWÓRZ POKÓJ</h2>
      <div class="createUnderline"></div>
      <p class="createHint">Wpisz nazwę pokoju.<br>Kod pokoju zostanie wygenerowany automatycznie.</p>
      <label class="panelLabel" for="newRoomName">NAZWA POKOJU</label>
      <input class="roomInput createRoomName" id="newRoomName" maxlength="24" autocomplete="off" placeholder="Wpisz nazwę pokoju" />
      <label class="panelLabel codeRoomLabel" for="generatedRoomCode">KOD POKOJU</label>
      <div class="codeRow"><div class="generatedCodeInline" id="generatedRoomCode">${newCode}</div><button class="regenerateBtn" id="regenRoomCode" title="Wygeneruj nowy kod">↻</button></div>
      <div class="createActions"><button class="createSaveBtn" id="saveRoomBtn">▣&nbsp; ZAPISZ POKÓJ</button><button class="createClearBtn" id="clearRoomBtn">←&nbsp; COFNIJ</button></div>
    </section>

    <section class="joinPanel">
      <h2>DOŁĄCZ DO POKOJU</h2>
      <p class="joinText">Wybierz pokój z listy albo wpisz kod pokoju.</p>
      <button class="refreshBtn" id="refreshRoomsBtn">↻ ODŚWIEŻ</button>
      <div class="listTitle"><span></span><b>TWOJE POKOJE</b><span></span></div>
      <div class="recentList">${slots}</div>
      <div class="manualTitle"><span></span><b>LUB WPISZ KOD POKOJU</b><span></span></div>
      <div class="bottomJoinBox"><input class="roomInput roomCodeInput" id="joinCode" maxlength="7" autocomplete="off" placeholder="Wpisz 7-znakowy kod pokoju" /><button class="joinSmallBtn" id="joinRoomBtn">DOŁĄCZ</button></div>
    </section>
  </div>

  <button class="logoutRoomsBtn" id="logoutBtn">↪&nbsp; WYLOGUJ / ZMIEŃ PROFIL</button>
  ${version()}
</section>`;
const normalizeCode=(v)=>v.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7);
const joinByCode=()=>{const input=document.getElementById('joinCode');const code=normalizeCode(input.value);input.value=code;if(code.length!==7)return toast('Kod pokoju musi mieć 7 znaków.');addRecent({code,name:'Pokój '+code,lastPlayed:'teraz'});toast('Dodano pokój '+code);renderRooms()};
document.getElementById('joinRoomBtn').onclick=joinByCode;
document.querySelectorAll('.roomJoin').forEach(b=>b.onclick=()=>{const r=recentRooms()[Number(b.dataset.i)];if(r)toast('Dołączanie do pokoju '+r.code)});
document.getElementById('saveRoomBtn').onclick=()=>{const name=document.getElementById('newRoomName').value.trim();const code=document.getElementById('generatedRoomCode').textContent.trim();if(name.length<2)return toast('Wpisz nazwę pokoju.');addRecent({code,name,lastPlayed:'teraz'});toast('Pokój zapisany: '+code);renderRooms()};
document.getElementById('clearRoomBtn').onclick=()=>{document.getElementById('newRoomName').value='';document.getElementById('generatedRoomCode').textContent=roomCode();};
document.getElementById('regenRoomCode').onclick=()=>{document.getElementById('generatedRoomCode').textContent=roomCode();};
document.getElementById('refreshRoomsBtn').onclick=()=>renderRooms();
document.getElementById('joinCode').addEventListener('input',e=>{e.target.value=normalizeCode(e.target.value)});
document.getElementById('logoutBtn').onclick=()=>{storage.remove('gr_logged_in');renderLogin()};
}
function openCreateRoom(){renderRooms()}
function init(){storage.get('gr_logged_in')&&profile()?renderRooms():renderLogin()}init();
