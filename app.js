
function openBingoGameRoom(){
  var nick = "";
  var room = "";
  try {
    nick = localStorage.getItem("gameRoomNick") || localStorage.getItem("playerNick") || localStorage.getItem("bingoNick") || "";
    room = localStorage.getItem("gameRoomCode") || localStorage.getItem("roomCode") || localStorage.getItem("bingoRoomCode") || "";
  } catch(e) {}
  var url = "games/bingo/index.html";
  var q = [];
  if(nick) q.push("nick=" + encodeURIComponent(nick));
  if(room) q.push("room=" + encodeURIComponent(room));
  var returnUrl = new URL("index.html", window.location.href).href;
  returnUrl += "?open=games" + (room ? "&room=" + encodeURIComponent(room) : "");
  try { localStorage.setItem("bingoReturnUrl", returnUrl); } catch(e) {}
  q.push("return=" + encodeURIComponent(returnUrl));
  if(q.length) url += "?" + q.join("&");
  window.location.href = url;
}
window.openBingoGameRoom = openBingoGameRoom;

const VERSION = 'GAME ROOM v1100';
const app = document.getElementById('app');
const storage={get(k,d=null){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))},remove(k){localStorage.removeItem(k)}};


// GAME ROOM HUB v1077 — wspólne dane dla wszystkich gier.
// Na tym etapie zapis jest bezpieczny: lokalny fallback + gotowy kształt pod Firebase.
const HUB_KEYS={profiles:'gr_hub_profiles',rooms:'gr_hub_rooms',active:'gr_hub_active_room'};
const HUB_PATHS={profiles:'profiles',rooms:'rooms',games:'games'};
function hubGet(key,def={}){return storage.get(key,def)||def}
function hubSet(key,val){storage.set(key,val)}
function hubProfilePayload(p){
  if(!p)return null;
  return {playerId:p.playerId,nick:p.name||'',name:p.name||'',countryCode:p.countryCode||'PL',country:p.country||'',avatar:p.avatar||'blue',cap:p.cap||null,updatedAt:Date.now()};
}
function hubRoomPayload(room,p){
  if(!room||!room.code)return null;
  const player=p||profile();
  const isOwner=room.ownerId===player?.playerId;
  return {roomId:room.code,code:room.code,roomName:room.name||'Pokój',name:room.name||'Pokój',admin:room.ownerId||room.admin||player?.playerId||'',activeGame:room.activeGame||'lobby',players:{[player?.playerId||'unknown']:{playerId:player?.playerId||'',nick:player?.name||'',online:true,role:isOwner?'admin':'player',joinedAt:Date.now()}},updatedAt:Date.now()};
}
function saveHubProfile(p){
  const payload=hubProfilePayload(p); if(!payload)return;
  const all=hubGet(HUB_KEYS.profiles,{}); all[payload.playerId]=payload; hubSet(HUB_KEYS.profiles,all);
}
function saveHubRoom(room,p){
  const payload=hubRoomPayload(room,p); if(!payload)return;
  const all=hubGet(HUB_KEYS.rooms,{}); const old=all[payload.code]||{};
  all[payload.code]={...old,...payload,players:{...(old.players||{}),...(payload.players||{})}};
  hubSet(HUB_KEYS.rooms,all); hubSet(HUB_KEYS.active,payload.code);
}
function setHubActiveGame(room,gameId){
  if(!room||!room.code)return;
  const all=hubGet(HUB_KEYS.rooms,{}); const old=all[room.code]||hubRoomPayload(room,profile())||{};
  all[room.code]={...old,activeGame:gameId,updatedAt:Date.now()};
  hubSet(HUB_KEYS.rooms,all); hubSet(HUB_KEYS.active,room.code);
}
function buildGameContext(room,gameId){
  const p=profile()||{};
  const params=new URLSearchParams({game:gameId,room:room?.code||'',roomName:room?.name||'',player:p.playerId||'',nick:p.name||'',lang:lang(),admin:(room?.ownerId===p.playerId||room?.admin===p.playerId)?'1':'0'});
  return params.toString();
}

const countries={PL:'Polska (PL)',DE:'Niemcy (DE)',NL:'Holandia (NL)',GB:'Wielka Brytania (GB)',FR:'Francja (FR)',ES:'Hiszpania (ES)',IT:'Włochy (IT)',AT:'Austria (AT)',BE:'Belgia (BE)',CH:'Szwajcaria (CH)',SE:'Szwecja (SE)',NO:'Norwegia (NO)',DK:'Dania (DK)',FI:'Finlandia (FI)',IE:'Irlandia (IE)',PT:'Portugalia (PT)',CZ:'Czechy (CZ)',SK:'Słowacja (SK)',HU:'Węgry (HU)',RO:'Rumunia (RO)',BG:'Bułgaria (BG)',GR:'Grecja (GR)',TR:'Turcja (TR)',UA:'Ukraina (UA)',LT:'Litwa (LT)',LV:'Łotwa (LV)',EE:'Estonia (EE)',US:'USA (US)',CA:'Kanada (CA)',BR:'Brazylia (BR)',AR:'Argentyna (AR)',MX:'Meksyk (MX)',AU:'Australia (AU)',JP:'Japonia (JP)',KR:'Korea Południowa (KR)',CN:'Chiny (CN)',IN:'Indie (IN)',ZA:'RPA (ZA)',MA:'Maroko (MA)',EG:'Egipt (EG)'};

const I18N={
  pl:{settings:'USTAWIENIA',settingsTitle:'USTAWIENIA',language:'JĘZYK',polish:'POLSKI',english:'ENGLISH',editProfile:'EDYTUJ PROFIL',nick:'Nick / nazwa',pin:'PIN',avatar:'Kapsel / avatar',saveChanges:'ZAPISZ ZMIANY',deleteProfile:'USUŃ PROFIL',back:'COFNIJ',about:'GAME ROOM — wspólny profil i pokoje dla wszystkich gier.',loginLabel:'Login/numer',loginBtn:'ZALOGUJ SIĘ',createProfile:'UTWÓRZ NOWY PROFIL',badLogin:'Zły numer gracza lub PIN.',createFirst:'Najpierw utwórz profil.',profileUpdated:'Profil zaktualizowany.',profileDeleted:'Profil usunięty.',noProfile:'Brak profilu do edycji.',nameMin:'Nick musi mieć minimum 2 znaki.',pin4:'PIN musi mieć 4 cyfry.',deleteConfirm:'Czy na pewno usunąć profil?'},
  en:{settings:'SETTINGS',settingsTitle:'SETTINGS',language:'LANGUAGE',polish:'POLISH',english:'ENGLISH',editProfile:'EDIT PROFILE',nick:'Name / nick',pin:'PIN',avatar:'Cap / avatar',saveChanges:'SAVE CHANGES',deleteProfile:'DELETE PROFILE',back:'BACK',about:'GAME ROOM — one profile and rooms for all games.',loginLabel:'Login / ID',loginBtn:'LOGIN',createProfile:'CREATE NEW PROFILE',badLogin:'Wrong player number or PIN.',createFirst:'Create a profile first.',profileUpdated:'Profile updated.',profileDeleted:'Profile deleted.',noProfile:'No profile to edit.',nameMin:'Nick must have at least 2 characters.',pin4:'PIN must be 4 digits.',deleteConfirm:'Are you sure you want to delete this profile?'}
};
function lang(){return storage.get('gr_lang','pl')}
function tr(k){return (I18N[lang()]&&I18N[lang()][k])||I18N.pl[k]||k}

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
  const currentLang=lang();
  const modal=document.createElement('div');
  modal.className='settingsOverlay';
  modal.innerHTML=`<div class="settingsBox">
    <h2>${tr('settingsTitle')}</h2>
    <div class="settingsSection">
      <div class="settingsTitle">${tr('language')}</div>
      <div class="settingsRow two"><button class="settingsChoice ${currentLang==='pl'?'active':''}" id="langPL">${tr('polish')}</button><button class="settingsChoice ${currentLang==='en'?'active':''}" id="langEN">${tr('english')}</button></div>
    </div>
    <div class="settingsSection">
      <div class="settingsTitle">${tr('editProfile')}</div>
      <label>${tr('nick')}</label>
      <input id="setName" maxlength="20" value="${esc(p?.name||'')}" placeholder="${tr('nick')}" ${p?'':'disabled'} />
      <label>${tr('pin')}</label>
      <input id="setPin" maxlength="4" inputmode="numeric" value="${esc(p?.pin||'')}" placeholder="4 cyfry" ${p?'':'disabled'} />
      <label>${tr('avatar')}</label>
      <select id="setAvatar" ${p?'':'disabled'}>
        <option value="blue" ${p?.avatar==='blue'?'selected':''}>Blue cap</option>
        <option value="red" ${p?.avatar==='red'?'selected':''}>Red cap</option>
        <option value="green" ${p?.avatar==='green'?'selected':''}>Green cap</option>
        <option value="yellow" ${p?.avatar==='yellow'?'selected':''}>Yellow cap</option>
      </select>
      <button class="settingsMain" id="saveSettingsProfile" ${p?'':'disabled'}>${tr('saveChanges')}</button>
    </div>
    <div class="settingsRow">
      <button class="settingsDanger" id="deleteProfileBtn" ${p?'':'disabled'}>${tr('deleteProfile')}</button>
      <button class="settingsBack" id="closeSettingsBtn">${tr('back')}</button>
    </div>
    <div class="settingsAbout">${tr('about')}</div>
  </div>`;
  document.querySelector('.screen')?.appendChild(modal);
  document.getElementById('closeSettingsBtn').onclick=()=>modal.remove();
  document.getElementById('langPL').onclick=()=>{storage.set('gr_lang','pl');modal.remove();renderLogin();setTimeout(openSettings,40)};
  document.getElementById('langEN').onclick=()=>{storage.set('gr_lang','en');modal.remove();renderLogin();setTimeout(openSettings,40)};
  const pinEl=document.getElementById('setPin');
  if(pinEl)pinEl.oninput=e=>e.target.value=e.target.value.replace(/\D/g,'').slice(0,4);
  const saveBtn=document.getElementById('saveSettingsProfile');
  if(saveBtn)saveBtn.onclick=()=>{
    const p=profile(); if(!p)return toast(tr('noProfile'));
    const name=document.getElementById('setName').value.trim();
    const pin=document.getElementById('setPin').value.trim();
    const avatar=document.getElementById('setAvatar').value;
    if(name.length<2)return toast(tr('nameMin'));
    if(pin.length!==4)return toast(tr('pin4'));
    const updatedProfile={...p,name,pin,avatar,updatedAt:Date.now()};
    storage.set('gr_profile',updatedProfile);
    saveHubProfile(updatedProfile);
    toast(tr('profileUpdated'));
    modal.remove();
    renderLogin();
  };
  const delBtn=document.getElementById('deleteProfileBtn');
  if(delBtn)delBtn.onclick=()=>{
    if(!profile())return toast(tr('noProfile'));
    if(confirm(tr('deleteConfirm'))){
      storage.remove('gr_profile');
      storage.remove('gr_logged_in');
      storage.remove('gr_recent_rooms');
      toast(tr('profileDeleted'));
      setTimeout(renderLogin,500);
    }
  };
}
function renderLogin(){
  const p=profile();
  const loginValue = p?.playerId || '';
  app.innerHTML=`<section class="screen login login-clean">
    <div class="login-shell">
      <div class="lang-switch" aria-label="language">
        <button id="langLoginPL" class="lang-btn ${lang()==='pl'?'active':''}" type="button">🇵🇱 PL</button>
        <button id="langLoginEN" class="lang-btn ${lang()==='en'?'active':''}" type="button">🇬🇧 EN</button>
      </div>

      <form class="login-card" id="loginForm" autocomplete="off">
        <label class="field-label" for="loginId">${tr('loginLabel').toUpperCase()}</label>
        <div class="input-wrap">
          <span class="input-icon user-icon">♙</span>
          <input id="loginId" class="login-input" autocomplete="username" value="${esc(loginValue)}" placeholder="${lang()==='pl'?'Wpisz login lub numer':'Enter login or ID'}" />
        </div>

        <label class="field-label" for="loginPin">PIN</label>
        <div class="input-wrap">
          <span class="input-icon pin-icon">▣</span>
          <input id="loginPin" class="login-input" type="password" inputmode="numeric" maxlength="4" autocomplete="current-password" placeholder="${lang()==='pl'?'Wpisz PIN':'Enter PIN'}" />
          <button type="button" id="togglePin" class="eye-btn" aria-label="show PIN">◉</button>
        </div>

        <button class="login-action login-main" id="loginBtn" type="submit"><span>↪</span>${tr('loginBtn')}</button>
        <div class="or-line"><span>${lang()==='pl'?'LUB':'OR'}</span></div>
        <button class="login-action login-create" id="createProfileBtn" type="button"><span>♙+</span>${lang()==='pl'?'UTWÓRZ PROFIL':'CREATE PROFILE'}</button>
      </form>
    </div>
    ${version()}
  </section>`;

  document.getElementById('langLoginPL').onclick=()=>{storage.set('gr_lang','pl');renderLogin()};
  document.getElementById('langLoginEN').onclick=()=>{storage.set('gr_lang','en');renderLogin()};
  document.getElementById('createProfileBtn').onclick=renderProfile;
  document.getElementById('togglePin').onclick=()=>{const pin=document.getElementById('loginPin');pin.type=pin.type==='password'?'text':'password'};
  document.getElementById('loginPin').oninput=e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,4)};
  document.getElementById('loginForm').onsubmit=(ev)=>{
    ev.preventDefault();
    const pid=document.getElementById('loginId').value.trim().toUpperCase();
    const pin=document.getElementById('loginPin').value.trim();
    const p=profile();
    if(!p)return toast(tr('createFirst'));
    if(pid!==p.playerId||pin!==p.pin)return toast(tr('badLogin'));
    storage.set('gr_logged_in',true);
    saveHubProfile(p);
    renderRooms();
  };
}
function profileT(pl,en){return lang()==='en'?en:pl}
function profileT(pl,en){return lang()==='en'?en:pl}
function renderCapPreview(cap){
  const c=cap||{};
  const shape=c.shape||'classic';
  const color=c.color||'blue';
  const symbol=c.symbol||'⚽';
  const img=c.image||'';
  const style=c.customColor?` style="--cap-color:${esc(c.customColor)}"`:'';
  return `<div class="capPreview cap3d cap-${shape} cap-${color}"${style}>
    <div class="capFace">${img?`<img src="${img}" alt="cap graphic"/>`:`<span>${esc(symbol)}</span>`}</div>
    <i class="capShine"></i>
  </div>`;
}
function renderProfile(){
let currentCountry='PL';
let currentId=id(currentCountry);
let currentCap={shape:'classic',color:'blue',symbol:'⚽',image:''};
const countryOptions=Object.entries(countries).map(([code,name])=>`<option value="${code}" ${code==='PL'?'selected':''}>${name}</option>`).join('');
app.innerHTML=`<section class="screen profile profile-v1051">
  <div class="profile-v1051-lang">
    <button id="profileLangPL" class="lang-btn ${lang()==='pl'?'active':''}" type="button">🇵🇱 PL</button>
    <button id="profileLangEN" class="lang-btn ${lang()==='en'?'active':''}" type="button">🇬🇧 EN</button>
  </div>

  <form class="profile-card-v1051" id="profileForm" autocomplete="off">
    <h1>${profileT('UTWÓRZ PROFIL','CREATE PROFILE')}</h1>

    <div class="profile-grid-v1051">
      <label class="profile-field-v1051"><span>${profileT('KRAJ','COUNTRY')}</span><select id="country" class="profile-input-v1051">${countryOptions}</select></label>
      <label class="profile-field-v1051"><span>${profileT('NUMER GRACZA','PLAYER ID')}</span><div id="playerText" class="profile-input-v1051 readonly">${currentId}</div></label>
    </div>

    <label class="profile-field-v1051"><span>${profileT('IMIĘ / NICK','NAME / NICK')}</span><input id="name" class="profile-input-v1051" maxlength="20" placeholder="${profileT('Wpisz swoje imię lub nick','Enter name or nick')}" /></label>

    <div class="profile-field-v1051"><span>${profileT('PIN (4 CYFRY)','PIN (4 DIGITS)')}</span><div class="pin-row-v1051"><input class="pinBox" maxlength="1" inputmode="numeric"><input class="pinBox" maxlength="1" inputmode="numeric"><input class="pinBox" maxlength="1" inputmode="numeric"><input class="pinBox" maxlength="1" inputmode="numeric"></div></div>

    <div class="cap-row-v1051">
      <div class="cap-preview-holder"><span>${profileT('KAPSEL / AVATAR','CAP / AVATAR')}</span><div id="capPreviewSlot">${renderCapPreview(currentCap)}</div></div>
      <button id="openCapCreator" class="cap-create-btn" type="button">${profileT('WYBIERZ / STWÓRZ KAPSEL','CHOOSE / CREATE CAP')}</button>
    </div>

    <div class="profile-actions-v1051"><button class="profile-save-v1051" id="saveBtn" type="submit">${profileT('ZAPISZ PROFIL','SAVE PROFILE')}</button><button class="profile-back-v1051" id="backBtn" type="button">${profileT('COFNIJ','BACK')}</button></div>
  </form>
  ${version()}
</section>`;
const c=document.getElementById('country');
c.onchange=()=>{currentCountry=c.value;currentId=id(currentCountry);document.getElementById('playerText').textContent=currentId};
document.getElementById('profileLangPL').onclick=()=>{storage.set('gr_lang','pl');renderProfile()};
document.getElementById('profileLangEN').onclick=()=>{storage.set('gr_lang','en');renderProfile()};
[...document.querySelectorAll('.pinBox')].forEach((el,i,arr)=>{
  el.oninput=()=>{el.value=el.value.replace(/\D/g,'').slice(0,1);if(el.value&&arr[i+1])arr[i+1].focus()};
  el.onkeydown=(e)=>{if(e.key==='Backspace'&&!el.value&&arr[i-1])arr[i-1].focus()};
});
function refreshCap(){document.getElementById('capPreviewSlot').innerHTML=renderCapPreview(currentCap)}
function openCapCreator(){
  const modal=document.createElement('div');
  modal.className='capCreatorOverlay';
  modal.innerHTML=`<div class="capCreatorBox">
    <h2>${profileT('KREATOR KAPSLA','CAP CREATOR')}</h2>
    <div class="capCreatorPreview" id="creatorPreview">${renderCapPreview(currentCap)}</div>
    <div class="capCreatorGrid">
      <div class="capCreatorSection"><h3>${profileT('KSZTAŁT','SHAPE')}</h3>
        <div class="capChoiceRow" data-group="shape">
          <button data-value="classic" class="capPick ${currentCap.shape==='classic'?'active':''}">${profileT('Kapsel','Cap')}</button>
          <button data-value="medal" class="capPick ${currentCap.shape==='medal'?'active':''}">${profileT('Medal','Medal')}</button>
          <button data-value="shield" class="capPick ${currentCap.shape==='shield'?'active':''}">${profileT('Tarcza','Shield')}</button>
          <button data-value="ball" class="capPick ${currentCap.shape==='ball'?'active':''}">${profileT('Piłka','Ball')}</button>
        </div>
      </div>
      <div class="capCreatorSection"><h3>${profileT('KOLOR','COLOR')}</h3>
        <div class="capChoiceRow" data-group="color">
          <button data-value="blue" class="capPick color blue ${currentCap.color==='blue'?'active':''}"></button>
          <button data-value="red" class="capPick color red ${currentCap.color==='red'?'active':''}"></button>
          <button data-value="green" class="capPick color green ${currentCap.color==='green'?'active':''}"></button>
          <button data-value="yellow" class="capPick color yellow ${currentCap.color==='yellow'?'active':''}"></button>
          <button data-value="black" class="capPick color black ${currentCap.color==='black'?'active':''}"></button>
          <label class="customColorLabel">${profileT('Własny','Custom')}<input id="customCapColor" type="color" value="${currentCap.customColor||'#1e9bff'}"></label>
        </div>
      </div>
      <div class="capCreatorSection"><h3>${profileT('GRAFIKA','GRAPHIC')}</h3>
        <div class="capChoiceRow" data-group="symbol">
          <button data-value="⚽" class="capPick symbol ${currentCap.symbol==='⚽'&&!currentCap.image?'active':''}"><b>⚽</b><small>${profileT('Piłka','Ball')}</small></button>
          <button data-value="🐱" class="capPick symbol ${currentCap.symbol==='🐱'&&!currentCap.image?'active':''}"><b>🐱</b><small>${profileT('Kot brytyjski','British cat')}</small></button>
          <button data-value="🐶" class="capPick symbol ${currentCap.symbol==='🐶'&&!currentCap.image?'active':''}"><b>🐶</b><small>${profileT('Jamnik','Dachshund')}</small></button>
          <button data-value="🌹" class="capPick symbol ${currentCap.symbol==='🌹'&&!currentCap.image?'active':''}"><b>🌹</b><small>${profileT('Róża','Rose')}</small></button>
          <button data-value="⛺" class="capPick symbol ${currentCap.symbol==='⛺'&&!currentCap.image?'active':''}"><b>⛺</b><small>${profileT('Namiot','Tent')}</small></button>
          <button data-value="🐟" class="capPick symbol ${currentCap.symbol==='🐟'&&!currentCap.image?'active':''}"><b>🐟</b><small>${profileT('Ryba','Fish')}</small></button>
          <button data-value="🦂" class="capPick symbol ${currentCap.symbol==='🦂'&&!currentCap.image?'active':''}"><b>🦂</b><small>${profileT('Skorpion','Scorpion')}</small></button>
          <button data-value="🚗" class="capPick symbol ${currentCap.symbol==='🚗'&&!currentCap.image?'active':''}"><b>🚗</b><small>${profileT('Samochód','Car')}</small></button>
          <button data-value="🕊️" class="capPick symbol ${currentCap.symbol==='🕊️'&&!currentCap.image?'active':''}"><b>🕊️</b><small>${profileT('Gołąb','Dove')}</small></button>
        </div>
        <label class="uploadCapBtn">${profileT('DODAJ ZDJĘCIE / GRAFIKĘ','ADD IMAGE')}<input id="capFileInput" type="file" accept="image/*"></label>
      </div>
    </div>
    <div class="capCreatorActions"><button id="saveCapBtn" class="profile-save-v1051" type="button">${profileT('ZAPISZ KAPSEL','SAVE CAP')}</button><button id="closeCapBtn" class="profile-back-v1051" type="button">${profileT('COFNIJ','BACK')}</button></div>
  </div>`;
  document.querySelector('.screen').appendChild(modal);
  const updateCreator=()=>{document.getElementById('creatorPreview').innerHTML=renderCapPreview(currentCap)};
  modal.querySelectorAll('.capChoiceRow').forEach(row=>{
    const group=row.dataset.group;
    row.querySelectorAll('.capPick').forEach(btn=>btn.onclick=()=>{
      if(group==='shape') currentCap.shape=btn.dataset.value;
      if(group==='color'){currentCap.color=btn.dataset.value; delete currentCap.customColor;}
      if(group==='symbol'){currentCap.symbol=btn.dataset.value; currentCap.image='';}
      row.querySelectorAll('.capPick').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
      updateCreator();
    });
  });
  const colorInput=document.getElementById('customCapColor');
  colorInput.oninput=()=>{currentCap.color='custom';currentCap.customColor=colorInput.value;updateCreator()};
  const fileInput=document.getElementById('capFileInput');
  fileInput.onchange=()=>{
    const file=fileInput.files&&fileInput.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{currentCap.image=reader.result;updateCreator()};
    reader.readAsDataURL(file);
  };
  document.getElementById('closeCapBtn').onclick=()=>modal.remove();
  document.getElementById('saveCapBtn').onclick=()=>{refreshCap();modal.remove();toast(profileT('Kapsel zapisany.','Cap saved.'))};
}
document.getElementById('openCapCreator').onclick=openCapCreator;
document.getElementById('backBtn').onclick=renderLogin;
document.getElementById('profileForm').onsubmit=(ev)=>{ev.preventDefault();const name=document.getElementById('name').value.trim();const pin=[...document.querySelectorAll('.pinBox')].map(x=>x.value).join('');if(name.length<2)return toast(profileT('Wpisz imię lub nick.','Enter name or nick.'));if(pin.length!==4)return toast(profileT('PIN musi mieć 4 cyfry.','PIN must have 4 digits.'));const newProfile={playerId:currentId,countryCode:c.value,country:countries[c.value],name,pin,avatar:currentCap.color||'blue',cap:currentCap,createdAt:Date.now()};storage.set('gr_profile',newProfile);saveHubProfile(newProfile);toast(profileT('Profil zapisany.','Profile saved.'));setTimeout(renderLogin,700)};
}
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
    <div class="roomCapAvatar">${renderCapPreview(p.cap || {color:p.avatar||'blue',symbol:'★'})}</div>
    <div class="gr-welcome">Witaj,<br><span>${p.name}</span></div>
    <div class="gr-player-no"><span>NR GRACZA:</span><strong>${p.playerId}</strong></div>
  </div>

  <div class="gr-stage">
    <div class="gr-panel gr-create-panel gr-create-launch">
      <h2>DODAJ POKÓJ</h2>
      <button id="openCreateRoomModal" class="gr-open-create" type="button">+ DODAJ POKÓJ</button>
    </div>

    <div class="gr-panel gr-join-panel">
      <h2>DOŁĄCZ DO POKOJU</h2>
      <div class="gr-section-title">TWOJE POKOJE</div>
      <div class="gr-room-list">${slots}</div>
      <div class="gr-manual-title">LUB WPISZ KOD POKOJU</div>
      <div class="gr-manual"><input id="joinCode" class="gr-input" maxlength="7" autocomplete="off" placeholder="Wpisz 7-znakowy kod pokoju" /><button id="joinRoomBtn" class="gr-join-manual" type="button">DOŁĄCZ</button></div>
    </div>
  </div>

  <button class="gr-gear" id="gearBtn" type="button" aria-label="Ustawienia">⚙</button>
  <button class="gr-logout" id="logoutBtn">↪ WYLOGUJ / ZMIEŃ PROFIL</button>

  <div id="createRoomModal" class="gr-modal hidden" aria-hidden="true">
    <div class="gr-modal-card">
      <h3>UTWÓRZ POKÓJ</h3>
      <label for="newRoomName">NAZWA POKOJU</label>
      <input id="newRoomName" class="gr-input" maxlength="24" autocomplete="off" placeholder="Wpisz nazwę pokoju" />
      <label>KOD POKOJU</label>
      <div class="gr-code-row"><div id="generatedRoomCode" class="gr-generated">${newCode}</div><button id="regenRoomCode" class="gr-regenerate" type="button" title="Nowy kod">↻</button></div>
      <div class="gr-modal-actions"><button id="saveRoomBtn" class="gr-save" type="button">▣ ZAPISZ POKÓJ</button><button id="closeCreateRoomModal" class="gr-back" type="button">ZAMKNIJ</button></div>
    </div>
  </div>

  ${version()}
</section>`;
const normalizeCode=(id)=>document.getElementById(id).value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
const joinByCode=()=>{const code=normalizeCode('joinCode');if(code.length!==7)return toast(lang()==='en'?'Enter a 7-character room code.':'Wpisz 7-znakowy kod pokoju.');const r={code,name:(lang()==='en'?'Room':'Pokój'),lastPlayed:'teraz',joinedBy:p.playerId};addRecent(r);saveHubRoom(r,p);renderGames(r)};
document.getElementById('joinRoomBtn').onclick=joinByCode;
document.getElementById('joinCode').oninput=e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7)};
const regenBtn=document.getElementById('regenRoomCode'); if(regenBtn) regenBtn.onclick=(e)=>{e.preventDefault();document.getElementById('generatedRoomCode').textContent=roomCode()};
const refreshBtn=document.getElementById('refreshRoomsBtn'); if(refreshBtn) refreshBtn.onclick=()=>toast('Lista pokoi odświeżona.');
document.querySelectorAll('.gr-join-card').forEach(b=>b.onclick=()=>{const r=rooms[Number(b.dataset.i)];if(r){saveHubRoom(r,p);renderGames(r)}});
const roomModal=document.getElementById('createRoomModal');
const openCreateRoomModal=()=>{roomModal.classList.remove('hidden');roomModal.setAttribute('aria-hidden','false');setTimeout(()=>{const el=document.getElementById('newRoomName'); if(el) el.focus();},30)};
const closeCreateRoomModal=()=>{roomModal.classList.add('hidden');roomModal.setAttribute('aria-hidden','true');};
document.getElementById('openCreateRoomModal').onclick=(e)=>{e.preventDefault();openCreateRoomModal();};
document.getElementById('closeCreateRoomModal').onclick=(e)=>{e.preventDefault();closeCreateRoomModal();};
roomModal.onclick=(e)=>{if(e.target===roomModal) closeCreateRoomModal();};
document.getElementById('saveRoomBtn').onclick=(e)=>{e.preventDefault();const name=document.getElementById('newRoomName').value.trim();const code=document.getElementById('generatedRoomCode').textContent.trim();if(name.length<2)return toast('Wpisz nazwę pokoju.');const newRoom={code,name,lastPlayed:'teraz',ownerId:p.playerId,pin:p.pin,activeGame:'lobby'};addRecent(newRoom);saveHubRoom(newRoom,p);toast('Pokój zapisany: '+code);renderRooms()};
document.getElementById('logoutBtn').onclick=()=>{storage.remove('gr_logged_in');renderLogin()};
const gearBtn=document.getElementById('gearBtn'); if(gearBtn) gearBtn.onclick=openSettings;
}


function buildBingoLaunchUrl(room){
  const p = profile();
  const nick = p && p.name ? p.name : '';
  const playerId = p && p.playerId ? p.playerId : '';
  const roomCode = room && room.code ? room.code : '';
  const roomName = room && room.name ? room.name : '';

  try{
    localStorage.setItem('bingoNick', nick);
    localStorage.setItem('bingoRoomCode', roomCode);
    localStorage.setItem('bingoPlayerId', playerId);
    localStorage.setItem('bingoRoomName', roomName);
    localStorage.removeItem('bingoRoomState_v1018_' + roomCode);
    localStorage.removeItem('bingoRoomState_v1019_' + roomCode);
    localStorage.removeItem('bingoRoomState_v1020_' + roomCode);
  }catch(e){}

  const q = new URLSearchParams();
  q.set('game','bingo');
  q.set('room', roomCode);
  q.set('roomName', roomName);
  q.set('player', playerId);
  q.set('nick', nick);
  q.set('ts', String(Date.now()));
  return 'games/bingo/index.html?' + q.toString();
}

function renderGames(room){
  const p=profile(); if(!p)return renderLogin();
  room = {...(room||{}), activeGame:'lobby'};
  saveHubRoom(room,p);
  const l=lang();
  const dir=l==='en'?'en':'pl';
  const roomNameRaw = String(room?.name || (l==='en'?'Room':'Pokój'));
  const roomCodeRaw = String(room?.code || '');
  const roomNameClean = roomCodeRaw && (roomNameRaw === roomCodeRaw || roomNameRaw === 'Pokój '+roomCodeRaw || roomNameRaw === 'Room '+roomCodeRaw) ? (l==='en'?'Room':'Pokój') : roomNameRaw;
  const games=[
    {id:'typer',pl:'TYPER',en:'TYPER',img:'typer'},
    {id:'caps',pl:'KAPSLE',en:'BOTTLE CAPS',img:'caps'},
    {id:'zombie',pl:'ZOMBIE HANGMAN',en:'ZOMBIE HANGMAN',img:'zombie'},
    {id:'bingo',pl:'BINGO',en:'BINGO',img:'bingo'},
    {id:'ships',pl:'STATKI',en:'BATTLESHIPS',img:'ships'},
    {id:'word',pl:'ZGADNIJ HASŁO',en:'GUESS THE WORD',img:'word'}
  ];
  app.innerHTML=`<section class="screen games games-${l}">
    <button id="gamesLangPL" class="games-hot games-lang-pl" type="button" aria-label="PL"></button>
    <button id="gamesLangEN" class="games-hot games-lang-en" type="button" aria-label="EN"></button>
    <div class="games-player-head">
      <button id="gamesGearBtn" class="games-gear" type="button" aria-label="Ustawienia">⚙</button>
      <div class="games-cap">${renderCapPreview(p.cap || {color:p.avatar||'blue',symbol:'★'})}</div>
      <div class="games-welcome">${l==='en'?'Hi,':'Witaj,'}<br><span>${esc(p.name)}</span></div>
      <div class="games-player-no"><span>${l==='en'?'PLAYER ID:':'NR GRACZA:'}</span><strong>${esc(p.playerId)}</strong></div>
      <div class="games-room-title"><span>${l==='en'?'ROOM:':'POKÓJ:'}</span><strong>${esc(roomNameClean)}</strong><em>${l==='en'?'CODE:':'KOD:'} ${esc(roomCodeRaw)}</em></div>
    </div>
    <div class="games-graphic-panel">
      <div class="games-title">${l==='en'?'CHOOSE A GAME':'WYBIERZ GRĘ'}</div>
      <div class="games-subtitle">${l==='en'?'PLAY WITH US!':'GRAJ Z NAMI!'}</div>
      <div class="games-grid">
        ${games.map(g=>`<button class="game-graphic-btn" data-game="${g.id}" aria-label="${l==='en'?g.en:g.pl}"><img src="assets/buttons/games/${dir}/${g.img}.png?v=1080" alt="${l==='en'?g.en:g.pl}"></button>`).join('')}
      </div>
      <button id="gamesBackBtn" class="game-graphic-back" aria-label="${l==='en'?'Back':'Cofnij'}"><img src="assets/buttons/games/${dir}/back.png?v=1080" alt="${l==='en'?'Back':'Cofnij'}"></button>
    </div>
    ${version()}
  </section>`;
  document.getElementById('gamesLangPL').onclick=()=>{storage.set('gr_lang','pl');renderGames(room)};
  document.getElementById('gamesLangEN').onclick=()=>{storage.set('gr_lang','en');renderGames(room)};
  const gamesGearBtn=document.getElementById('gamesGearBtn'); if(gamesGearBtn) gamesGearBtn.onclick=openSettings;
  document.getElementById('gamesBackBtn').onclick=renderRooms;
  document.querySelectorAll('.game-graphic-btn').forEach(btn=>btn.onclick=()=>{
    const g=games.find(x=>x.id===btn.dataset.game);
    if(!g)return;
    setHubActiveGame(room,g.id);
    const ctx=buildGameContext(room,g.id);
    storage.set('gr_last_game_context',{game:g.id,query:ctx,roomCode:room?.code||'',playerId:p.playerId,createdAt:Date.now()});
    if(g.id==='typer'){
      window.location.href='games/typer/index.html?'+ctx;
      return;
    }
    if(g.id==='bingo'){
      const returnUrl = new URL('index.html', window.location.href).href + '?open=games' + ((room?.code||room?.roomId) ? '&room=' + encodeURIComponent(room?.code||room?.roomId) : '');
      try { localStorage.setItem('bingoReturnUrl', returnUrl); } catch(e) {}
      window.location.href=buildBingoLaunchUrl(room);
      return;
    }
    renderGameStage(room,g);
  });
}

function getHubRoomByCode(code){
  const rooms=hubGet(HUB_KEYS.rooms,{});
  return rooms?.[code]||null;
}
function localRoomFromHub(hubRoom){
  if(!hubRoom)return null;
  return {code:hubRoom.code||hubRoom.roomId,name:hubRoom.name||hubRoom.roomName||'Pokój',ownerId:hubRoom.admin,activeGame:hubRoom.activeGame||'lobby'};
}
function gameLabel(gameId){
  const l=lang();
  const labels={
    typer:{pl:'TYPER',en:'TYPER'},
    caps:{pl:'KAPSLE',en:'BOTTLE CAPS'},
    zombie:{pl:'ZOMBIE HANGMAN',en:'ZOMBIE HANGMAN'},
    bingo:{pl:'BINGO',en:'BINGO'},
    ships:{pl:'STATKI',en:'BATTLESHIPS'},
    word:{pl:'ZGADNIJ HASŁO',en:'GUESS THE WORD'}
  };
  return labels[gameId]?.[l]||String(gameId||'').toUpperCase();
}
function hubPlayersForRoom(room){
  const p=profile()||{};
  const hubRoom=getHubRoomByCode(room?.code||room?.roomId||'')||{};
  const players=Object.values(hubRoom.players||{}).filter(Boolean);
  if(!players.some(x=>x.playerId===p.playerId)){
    players.unshift({playerId:p.playerId,nick:p.name||'',role:(room?.ownerId===p.playerId||hubRoom.admin===p.playerId)?'admin':'player',online:true});
  }
  return players;
}
function isRoomAdmin(room){
  const p=profile()||{};
  const hubRoom=getHubRoomByCode(room?.code||room?.roomId||'')||{};
  return (hubRoom.admin&&hubRoom.admin===p.playerId) || (room?.ownerId&&room.ownerId===p.playerId);
}
function renderTyperLobby(room){
  const p=profile(); if(!p)return renderLogin();
  const l=lang();
  const hubRoom=getHubRoomByCode(room?.code||room?.roomId||'')||{};
  const roomName=hubRoom.roomName||hubRoom.name||room?.name||room?.roomName||(l==='en'?'Room':'Pokój');
  const roomCode=hubRoom.code||hubRoom.roomId||room?.code||room?.roomId||'';
  const adminId=hubRoom.admin||room?.ownerId||'';
  const players=hubPlayersForRoom({...room,code:roomCode});
  const admin=isRoomAdmin({...room,code:roomCode});
  app.innerHTML=`<section class="screen typer-lobby">
    <div class="typer-lobby-card">
      <div class="typer-lobby-kicker">${l==='en'?'GAME LOBBY':'LOBBY GRY'}</div>
      <h1>TYPER</h1>
      <div class="typer-lobby-sub">${l==='en'?'Room prepared from GAME ROOM':'Pokój przejęty z GAME ROOM'}</div>

      <div class="typer-room-strip">
        <div><span>${l==='en'?'ROOM':'POKÓJ'}</span><strong>${esc(roomName)}</strong></div>
        <div><span>${l==='en'?'CODE':'KOD'}</span><strong>${esc(roomCode)}</strong></div>
        <div><span>ADMIN</span><strong>${esc(adminId||'—')}</strong></div>
      </div>

      <div class="typer-main-grid">
        <div class="typer-players-box">
          <h2>${l==='en'?'PLAYERS IN ROOM':'GRACZE W POKOJU'}</h2>
          <div class="typer-player-list">
            ${players.map(pl=>`<div class="typer-player-row ${pl.playerId===p.playerId?'me':''}"><span class="dot ${pl.online?'on':'off'}"></span><div><strong>${esc(pl.nick||pl.name||'Gracz')}</strong><em>${esc(pl.playerId||'')}</em></div><b>${(pl.role==='admin'||pl.playerId===adminId)?'ADMIN':''}</b></div>`).join('')}
          </div>
        </div>
        <div class="typer-actions-box">
          <h2>${l==='en'?'TYPER STATUS':'STATUS TYPERA'}</h2>
          <p>${l==='en'?'This is the first real Typer lobby inside GAME ROOM. The next step will attach rounds, predictions and rankings.':'To jest pierwsze prawdziwe lobby Typera wewnątrz GAME ROOM. Następny krok to podpięcie kolejek, typowania i rankingów.'}</p>
          <button id="typerStartBtn" class="typer-start" type="button" ${admin?'':'disabled'}>${l==='en'?'START TYPER':'START TYPER'}</button>
          <div class="typer-admin-note">${admin?(l==='en'?'You are the room admin.':'Jesteś adminem pokoju.'):(l==='en'?'Only room admin can start.':'Tylko admin pokoju może rozpocząć.')}</div>
          <button id="typerBackBtn" class="typer-back" type="button">${l==='en'?'BACK TO GAME ROOM':'WRÓĆ DO GAME ROOM'}</button>
        </div>
      </div>
    </div>
    ${version()}
  </section>`;
  document.getElementById('typerBackBtn').onclick=()=>{setHubActiveGame({code:roomCode,name:roomName,ownerId:adminId},'lobby');renderGames({code:roomCode,name:roomName,ownerId:adminId})};
  document.getElementById('typerStartBtn').onclick=()=>toast(l==='en'?'Next step: Typer rounds.':'Następny krok: kolejki Typera.');
}
function renderGameStage(room,game){
  const p=profile(); if(!p)return renderLogin();
  const l=lang();
  const gameId=typeof game==='string'?game:game?.id;
  if(gameId==='typer'){ window.location.href='games/typer/index.html?'+buildGameContext(room,'typer'); return; }
  if(gameId==='bingo'){
    const returnUrl = new URL('index.html', window.location.href).href + '?open=games' + ((room?.code||room?.roomId) ? '&room=' + encodeURIComponent(room?.code||room?.roomId) : '');
    try { localStorage.setItem('bingoReturnUrl', returnUrl); } catch(e) {}
    window.location.href=buildBingoLaunchUrl(room);
    return;
  }
  const label=typeof game==='object'?(l==='en'?game.en:game.pl):gameLabel(gameId);
  const roomName=room?.name||room?.roomName||(l==='en'?'Room':'Pokój');
  const roomCode=room?.code||room?.roomId||'';
  app.innerHTML=`<section class="screen game-stage game-stage-${esc(gameId)}">
    <div class="stage-card">
      <div class="stage-small">${l==='en'?'SELECTED GAME':'WYBRANO GRĘ'}</div>
      <h1>${esc(label)}</h1>
      <div class="stage-status">${l==='en'?'Game preparation':'Przygotowanie gry'}</div>
      <div class="stage-room"><strong>${esc(roomName)}</strong><span>${l==='en'?'CODE:':'KOD:'} ${esc(roomCode)}</span></div>
      <div class="stage-player">${esc(p.name)} · ${esc(p.playerId)}</div>
      <button id="stageBackBtn" class="stage-back" type="button">${l==='en'?'BACK TO GAME ROOM':'WRÓĆ DO GAME ROOM'}</button>
    </div>
    ${version()}
  </section>`;
  document.getElementById('stageBackBtn').onclick=()=>{
    setHubActiveGame(room,'lobby');
    renderGames(room);
  };
}

function openCreateRoom(){renderRooms()}
function init(){
  renderLogin();
}
init();
