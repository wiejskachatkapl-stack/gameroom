const VERSION = 'GAME ROOM v1051';
const app = document.getElementById('app');
const storage={get(k,d=null){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))},remove(k){localStorage.removeItem(k)}};
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
    storage.set('gr_profile',{...p,name,pin,avatar,updatedAt:Date.now()});
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
        <button class="login-action login-settings" id="helpBtn" type="button"><span>⚙</span>${tr('settings')}</button>
      </form>
    </div>
    ${version()}
  </section>`;

  document.getElementById('langLoginPL').onclick=()=>{storage.set('gr_lang','pl');renderLogin()};
  document.getElementById('langLoginEN').onclick=()=>{storage.set('gr_lang','en');renderLogin()};
  document.getElementById('createProfileBtn').onclick=renderProfile;
  document.getElementById('helpBtn').onclick=openSettings;
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
    renderRooms();
  };
}
function profileT(pl,en){return lang()==='en'?en:pl}
function profileT(pl,en){return lang()==='en'?en:pl}
function renderCapPreview(cap){
  const c=cap||{};
  const shape=c.shape||'classic', color=c.color||'blue', symbol=c.symbol||'★', img=c.image||'';
  const style=`--cap-color:${c.customColor||color}`;
  return `<div class="capPreview cap-${shape} cap-${color}" style="${style}">${img?`<img src="${img}" alt="cap"/>`:`<span>${esc(symbol)}</span>`}</div>`;
}
function renderProfile(){
let currentCountry='PL';
let currentId=id(currentCountry);
let currentCap={shape:'classic',color:'blue',symbol:'★',image:''};
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
          <button data-value="★" class="capPick symbol ${currentCap.symbol==='★'&&!currentCap.image?'active':''}">★</button>
          <button data-value="⚽" class="capPick symbol ${currentCap.symbol==='⚽'&&!currentCap.image?'active':''}">⚽</button>
          <button data-value="7" class="capPick symbol ${currentCap.symbol==='7'&&!currentCap.image?'active':''}">7</button>
          <button data-value="10" class="capPick symbol ${currentCap.symbol==='10'&&!currentCap.image?'active':''}">10</button>
          <button data-value="🚲" class="capPick symbol ${currentCap.symbol==='🚲'&&!currentCap.image?'active':''}">🚲</button>
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
document.getElementById('profileForm').onsubmit=(ev)=>{ev.preventDefault();const name=document.getElementById('name').value.trim();const pin=[...document.querySelectorAll('.pinBox')].map(x=>x.value).join('');if(name.length<2)return toast(profileT('Wpisz imię lub nick.','Enter name or nick.'));if(pin.length!==4)return toast(profileT('PIN musi mieć 4 cyfry.','PIN must have 4 digits.'));storage.set('gr_profile',{playerId:currentId,countryCode:c.value,country:countries[c.value],name,pin,avatar:currentCap.color||'blue',cap:currentCap,createdAt:Date.now()});toast(profileT('Profil zapisany.','Profile saved.'));setTimeout(renderLogin,700)};
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
