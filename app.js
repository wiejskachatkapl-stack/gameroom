const VERSION = 'GAME ROOM v1037';
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

function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function openSettings(){
  const p=profile();
  const currentLang=storage.get('gr_lang','pl');
  const modal=document.createElement('div');
  modal.className='settingsOverlay';
  modal.innerHTML=`<div class="settingsBox">
    <h2>USTAWIENIA</h2>
    <div class="settingsSection">
      <div class="settingsTitle">JĘZYK</div>
      <div class="settingsRow two"><button class="settingsChoice ${currentLang==='pl'?'active':''}" id="langPL">POLSKI</button><button class="settingsChoice ${currentLang==='en'?'active':''}" id="langEN">ENGLISH</button></div>
    </div>
    <div class="settingsSection">
      <div class="settingsTitle">EDYTUJ PROFIL</div>
      <label>Nick / nazwa</label>
      <input id="setName" maxlength="20" value="${esc(p?.name||'')}" placeholder="Nick" ${p?'':'disabled'} />
      <label>PIN</label>
      <input id="setPin" maxlength="4" inputmode="numeric" value="${esc(p?.pin||'')}" placeholder="4 cyfry" ${p?'':'disabled'} />
      <label>Kapsel / avatar</label>
      <select id="setAvatar" ${p?'':'disabled'}>
        <option value="blue" ${p?.avatar==='blue'?'selected':''}>Niebieski kapsel</option>
        <option value="red" ${p?.avatar==='red'?'selected':''}>Czerwony kapsel</option>
        <option value="green" ${p?.avatar==='green'?'selected':''}>Zielony kapsel</option>
        <option value="yellow" ${p?.avatar==='yellow'?'selected':''}>Żółty kapsel</option>
      </select>
      <button class="settingsMain" id="saveSettingsProfile" ${p?'':'disabled'}>ZAPISZ ZMIANY</button>
    </div>
    <div class="settingsRow">
      <button class="settingsDanger" id="deleteProfileBtn" ${p?'':'disabled'}>USUŃ PROFIL</button>
      <button class="settingsBack" id="closeSettingsBtn">COFNIJ</button>
    </div>
    <div class="settingsAbout">GAME ROOM — wspólny profil i pokoje dla wszystkich gier.</div>
  </div>`;
  document.querySelector('.screen')?.appendChild(modal);
  document.getElementById('closeSettingsBtn').onclick=()=>modal.remove();
  document.getElementById('langPL').onclick=()=>{storage.set('gr_lang','pl');toast('Język: Polski');modal.remove();openSettings()};
  document.getElementById('langEN').onclick=()=>{storage.set('gr_lang','en');toast('Language: English');modal.remove();openSettings()};
  const pinEl=document.getElementById('setPin');
  if(pinEl)pinEl.oninput=e=>e.target.value=e.target.value.replace(/\D/g,'').slice(0,4);
  const saveBtn=document.getElementById('saveSettingsProfile');
  if(saveBtn)saveBtn.onclick=()=>{
    const p=profile(); if(!p)return toast('Brak profilu do edycji.');
    const name=document.getElementById('setName').value.trim();
    const pin=document.getElementById('setPin').value.trim();
    const avatar=document.getElementById('setAvatar').value;
    if(name.length<2)return toast('Nick musi mieć minimum 2 znaki.');
    if(pin.length!==4)return toast('PIN musi mieć 4 cyfry.');
    storage.set('gr_profile',{...p,name,pin,avatar,updatedAt:Date.now()});
    toast('Profil zaktualizowany.');
    modal.remove();
    renderLogin();
  };
  const delBtn=document.getElementById('deleteProfileBtn');
  if(delBtn)delBtn.onclick=()=>{
    if(!profile())return toast('Brak profilu do usunięcia.');
    if(confirm('Czy na pewno usunąć profil?')){
      storage.remove('gr_profile');
      storage.remove('gr_logged_in');
      storage.remove('gr_recent_rooms');
      toast('Profil usunięty.');
      setTimeout(renderLogin,500);
    }
  };
}
function renderLogin(){const p=profile();app.innerHTML=`<section class="screen login">
<input class="hot loginField" id="loginId" autocomplete="username" value="${p?.playerId||''}" placeholder="" />
<input class="hot loginField" id="loginPin" type="password" inputmode="numeric" maxlength="4" autocomplete="current-password" placeholder="" />
<button class="btn" id="loginBtn">ZALOGUJ</button><button class="btn" id="createProfileBtn">UTWÓRZ PROFIL</button><button class="btn" id="helpBtn">POMOC</button>${version()}</section>`;
document.getElementById('createProfileBtn').onclick=renderProfile;
document.getElementById('helpBtn').onclick=openSettings;
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
const rooms=recentRooms().filter(r => r && (r.ownerId === p.playerId || r.joinedBy === p.playerId));
const listCount=Math.max(4,rooms.length);
const slots=Array.from({length:listCount},(_,i)=>{
  const r=rooms[i];
  if(!r)return `<div class="gr-room-card gr-empty" aria-hidden="true"></div>`;
  return `<div class="gr-room-card"><div class="gr-room-icon">♟</div><div class="gr-room-data"><div class="gr-room-name">${r.name||'Pokój'}</div><div class="gr-room-code"><span>Kod:</span> ${r.code}</div></div><button class="gr-join-card" data-i="${i}">DOŁĄCZ</button></div>`;
}).join('');
const newCode=roomCode();
app.innerHTML=`<section class="screen rooms gr-clean-rooms">
  <div class="gr-profile-head">
    <div class="gr-welcome">Witaj,<br><span>${p.name}</span></div>
    <div class="gr-player-no"><span>NR GRACZA:</span><strong>${p.playerId}</strong></div>
  </div>

  <div class="gr-stage">
    <div class="gr-panel gr-create-panel">
      <div class="gr-panel-icon">♟ ♟</div>
      <h2>UTWÓRZ POKÓJ</h2>
      <label for="newRoomName">NAZWA POKOJU</label>
      <input id="newRoomName" class="gr-input" maxlength="24" autocomplete="off" placeholder="Wpisz nazwę pokoju" />
      <label>KOD POKOJU</label>
      <div class="gr-code-row"><div id="generatedRoomCode" class="gr-generated">${newCode}</div><button id="regenRoomCode" class="gr-regenerate" title="Nowy kod">↻</button></div>
      <div class="gr-actions"><button id="saveRoomBtn" class="gr-save">▣ ZAPISZ POKÓJ</button><button id="clearRoomBtn" class="gr-back">← COFNIJ</button></div>
    </div>

    <div class="gr-panel gr-join-panel">
      <div class="gr-panel-icon blue">♟ ♟</div>
      <h2>DOŁĄCZ DO POKOJU</h2>
      <div class="gr-section-title">TWOJE POKOJE</div>
      <div class="gr-room-list">${slots}</div>
      <div class="gr-manual-title">LUB WPISZ KOD POKOJU</div>
      <div class="gr-manual"><input id="joinCode" class="gr-input" maxlength="7" autocomplete="off" placeholder="Wpisz 7-znakowy kod pokoju" /><button id="joinRoomBtn" class="gr-join-manual">DOŁĄCZ</button></div>
    </div>
  </div>

  <button class="gr-logout" id="logoutBtn">↪ WYLOGUJ / ZMIEŃ PROFIL</button>
  ${version()}
</section>`;
const normalizeCode=(id)=>document.getElementById(id).value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
const joinByCode=()=>{const code=normalizeCode('joinCode');if(code.length!==7)return toast('Wpisz 7-znakowy kod pokoju.');addRecent({code,name:'Pokój '+code,lastPlayed:'teraz',joinedBy:p.playerId});toast('Dodano pokój '+code);renderRooms()};
document.getElementById('joinRoomBtn').onclick=joinByCode;
document.getElementById('joinCode').oninput=e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7)};
document.getElementById('regenRoomCode').onclick=()=>{document.getElementById('generatedRoomCode').textContent=roomCode()};
const refreshBtn=document.getElementById('refreshRoomsBtn'); if(refreshBtn) refreshBtn.onclick=()=>toast('Lista pokoi odświeżona.');
document.querySelectorAll('.gr-join-card').forEach(b=>b.onclick=()=>{const r=recentRooms()[Number(b.dataset.i)];if(r)toast('Dołączanie do pokoju '+r.code)});
document.getElementById('saveRoomBtn').onclick=()=>{const name=document.getElementById('newRoomName').value.trim();const code=document.getElementById('generatedRoomCode').textContent.trim();if(name.length<2)return toast('Wpisz nazwę pokoju.');addRecent({code,name,lastPlayed:'teraz',ownerId:p.playerId,pin:p.pin});toast('Pokój zapisany: '+code);renderRooms()};
document.getElementById('clearRoomBtn').onclick=()=>{document.getElementById('newRoomName').value='';document.getElementById('generatedRoomCode').textContent=roomCode()};
document.getElementById('logoutBtn').onclick=()=>{storage.remove('gr_logged_in');renderLogin()};
}
function openCreateRoom(){renderRooms()}
function init(){storage.get('gr_logged_in')&&profile()?renderRooms():renderLogin()}init();
