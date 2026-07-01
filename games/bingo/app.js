(function(){
  'use strict';

  const VERSION = 'BINGO v1020';
  const STATS_KEY = 'bingoStats_v1020_local_backup';
  const ROOM_STATE_PREFIX = 'bingoRoomState_v1020_';

  const firebaseConfig = {
  apiKey: "AIzaSyCE-uY6HnDWdfKW03hioAlLM8BLj851fco",
  authDomain: "typer-b3087.firebaseapp.com",
  
    databaseURL: "https://typer-b3087-default-rtdb.europe-west1.firebasedatabase.app",projectId: "typer-b3087",
  storageBucket: "typer-b3087.firebasestorage.app",
  messagingSenderId: "1032303131493",
  appId: "1:1032303131493:web:8cc41341f3e42415d6ff8c",
  measurementId: "G-5FBDH5G15N"
};

  const screenStart = document.getElementById('screenStart');
  const screenGame = document.getElementById('screenGame');
  const btnPlay = document.getElementById('btnPlay');
  const btnExitStart = document.getElementById('btnExitStart');
  const btnExitGame = document.getElementById('btnExitGame');
  const playersPanel = document.getElementById('playersPanel');
  const playerNickEl = document.getElementById('playerNick');
  const roomCodeEl = document.getElementById('roomCode');
  const bingoBoard = document.getElementById('bingoBoard');
  const drawBall = document.getElementById('drawBall');
  const drawnNumbersEl = document.getElementById('drawnNumbers');
  const btnStartDraw = document.getElementById('btnStartDraw');
  const bingoWinMessage = document.getElementById('bingoWinMessage');
  const rankingRows = document.getElementById('rankingRows');

  const params = new URLSearchParams(window.location.search);

  if(params.get('nick') || params.get('room')){
    try{
      if(params.get('nick')) localStorage.setItem('bingoNick', params.get('nick'));
      if(params.get('room')) localStorage.setItem('bingoRoomCode', params.get('room'));
    }catch(e){}
  }


  const state = {
    nick: params.get('nick') || getStored('bingoNick') || 'Mariusz',
    roomCode: params.get('room') || getStored('bingoRoomCode') || 'PWG5N2D',
    players: [],
    card: [],
    drawnNumbers: [],
    drawTimer: null,
    drawSpinTimer: null,
    bingoFinished: false,
    isDrawing: false,
    winMessageTimer: null,
    winningLine: [],
    resultRecorded: false,
    lastRemoteWinner: '',
    stats: getStatsStore(),
    roomState: null,
    activeRound: {},
    presentRound: {},
    roundId: '',
    playerProgress: {},
    lastSyncedProgress: -1,
    db: null,
    roomRef: null,
    firebaseReady: false,
    localFallback: false
  };

  function getStored(key){
    try { return localStorage.getItem(key) || ''; } catch(e) { return ''; }
  }

  function setStored(key, value){
    try { localStorage.setItem(key, value); } catch(e) {}
  }

  function normalizeName(name){
    return String(name || '').trim().slice(0,18) || 'GRACZ';
  }

  function showScreen(name){
    screenStart.classList.toggle('is-active', name === 'start');
    screenGame.classList.toggle('is-active', name === 'game');
  }

  function roomPath(){
    return 'bingo/rooms/' + encodeURIComponent(state.roomCode || 'POKOJ');
  }

  function roomStateKey(){
    return ROOM_STATE_PREFIX + (state.roomCode || 'POKOJ');
  }

  function firebaseUsable(){
    return typeof firebase !== 'undefined' &&
      firebaseConfig &&
      !String(firebaseConfig.apiKey || '').includes('UZUPELNIJ');
  }

  function initFirebase(){
    if(state.firebaseReady || state.localFallback) return;

    if(!firebaseUsable()){
      state.localFallback = true;
      return;
    }

    try {
      if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      state.db = firebase.database();
      state.firebaseReady = true;
    } catch(e) {
      console.warn('BINGO Firebase init error:', e);
      state.localFallback = true;
    }
  }

  function getStatsStore(){
    try {
      const raw = localStorage.getItem(STATS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch(e){
      return {};
    }
  }

  function saveStatsStore(){
    try { localStorage.setItem(STATS_KEY, JSON.stringify(state.stats)); } catch(e) {}
  }

  function ensurePlayerStats(players){
    players.forEach(name => {
      const clean = normalizeName(name);
      if(!state.stats[clean]) state.stats[clean] = { points: 0, games: 0 };
      if(typeof state.stats[clean].points !== 'number') state.stats[clean].points = 0;
      if(typeof state.stats[clean].games !== 'number') state.stats[clean].games = 0;
    });
    saveStatsStore();
  }

  function getAverage(playerName){
    const row = state.stats[playerName] || { points: 0, games: 0 };
    return row.games ? row.points / row.games : 0;
  }

  function normalizeRoomState(data){
    const rawOwner = String((data && data.owner) || '').trim();
    const cleanOwner = rawOwner ? normalizeName(rawOwner) : '';
    const playersObj = data && data.players && typeof data.players === 'object' ? data.players : {};
    const players = Object.keys(playersObj).map(name => normalizeName(name)).filter(Boolean).slice(0,8);
    const joined = {};
    const progress = {};
    players.forEach(name => {
      joined[name] = !!(playersObj[name] && playersObj[name].joined);
      const rawProgress = playersObj[name] && Number(playersObj[name].progress);
      progress[name] = Number.isFinite(rawProgress) ? Math.max(0, Math.min(5, rawProgress)) : 0;
    });
    if(cleanOwner && !players.includes(cleanOwner)) players.unshift(cleanOwner);
    const activeRoundRaw = data && data.activeRound && typeof data.activeRound === 'object' ? data.activeRound : {};
    const activeRound = {};
    Object.keys(activeRoundRaw).forEach(name => {
      const clean = normalizeName(name);
      if(activeRoundRaw[name]) activeRound[clean] = true;
    });

    const presentRoundRaw = data && data.presentRound && typeof data.presentRound === 'object' ? data.presentRound : {};
    const presentRound = {};
    Object.keys(presentRoundRaw).forEach(name => {
      const clean = normalizeName(name);
      if(presentRoundRaw[name]) presentRound[clean] = true;
    });

    if(cleanOwner && Object.keys(activeRound).length === 0) activeRound[cleanOwner] = true;
    if(cleanOwner && Object.keys(presentRound).length === 0) presentRound[cleanOwner] = true;

    return {
      owner: cleanOwner,
      players: Array.from(new Set(players)).filter(name => name !== 'GRACZ' || state.nick === 'GRACZ').slice(0,8),
      joined,
      progress,
      activeRound,
      presentRound,
      roundId: data && data.roundId ? String(data.roundId) : '',
      drawnNumbers: Array.isArray(data && data.drawnNumbers) ? data.drawnNumbers.filter(n => Number.isInteger(n)).slice(0,75) : [],
      drawStatus: (data && data.drawStatus) || 'idle',
      currentBall: data && data.currentBall,
      winner: data && data.winner ? normalizeName(data.winner) : '',
      stats: data && data.stats && typeof data.stats === 'object' ? data.stats : {}
    };
  }

  function getDisplayPlayers(){
    const allPlayers = (state.roomState && Array.isArray(state.roomState.players) && state.roomState.players.length)
      ? state.roomState.players.slice(0,8)
      : (state.players.length ? state.players : [state.nick]).slice(0,8);

    // Prawa strona pokazuje tylko graczy aktualnie obecnych w Bingo.
    // Czerwona kropka = wszedł do Bingo, zielona = kliknął DOŁĄCZ.
    const present = state.presentRound && typeof state.presentRound === 'object'
      ? allPlayers.filter(name => !!state.presentRound[normalizeName(name)])
      : [];

    if(present.length) return Array.from(new Set(present.map(normalizeName))).slice(0,8);
    return [];
  }

  function isHost(){
    return !!(state.roomState && state.roomState.owner === state.nick);
  }

  function isJoinedPlayer(name){
    const clean = normalizeName(name);
    return !!(state.activeRound && state.activeRound[clean]);
  }

  function applyRemoteState(room){
    state.roomState = room;
    state.players = getDisplayPlayers();
    state.drawnNumbers = Array.isArray(room.drawnNumbers) ? room.drawnNumbers.slice(0,75) : [];
    state.playerProgress = room.progress && typeof room.progress === 'object' ? room.progress : {};
    state.activeRound = room.activeRound && typeof room.activeRound === 'object' ? room.activeRound : {};
    state.presentRound = room.presentRound && typeof room.presentRound === 'object' ? room.presentRound : {};
    state.roundId = room.roundId || state.roundId || '';
    if(room.stats && typeof room.stats === 'object'){
      state.stats = room.stats;
      saveStatsStore();
    }

    renderPlayers(getDisplayPlayers());
    updatePlayerProgress();
    renderRanking();
    renderDrawnNumbers();
    updatePrimaryButton();

    if(drawBall){
      drawBall.textContent = room.currentBall ? String(room.currentBall) : (state.drawnNumbers.length ? String(state.drawnNumbers[state.drawnNumbers.length - 1]) : '?');
    }

    if(room.winner && room.winner !== state.lastRemoteWinner){
      state.lastRemoteWinner = room.winner;
      state.bingoFinished = true;
      showRemoteBingoWinner(room.winner);
    }
  }

  function setupFirebaseRoom(){
    initFirebase();

    if(!state.firebaseReady){
      syncLocalRoomMembership();
      return;
    }

    state.roomRef = state.db.ref(roomPath());

    state.roomRef.once('value').then(snapshot => {
      const existing = snapshot.val();
      if(!existing || !existing.owner){
        return state.roomRef.set({
          owner: state.nick,
          createdAt: firebase.database.ServerValue.TIMESTAMP,
          drawStatus: 'idle',
          roundId: String(Date.now()),
          currentBall: null,
          drawnNumbers: [],
          activeRound: {
            [state.nick]: true
          },
          presentRound: {
            [state.nick]: true
          },
          players: {
            [state.nick]: {
              nick: state.nick,
              joined: true,
              progress: 0,
              online: true,
              joinedAt: firebase.database.ServerValue.TIMESTAMP
            }
          },
          stats: state.stats || {}
        });
      }

      const updates = {};
      updates['players/' + state.nick + '/nick'] = state.nick;
      updates['players/' + state.nick + '/online'] = true;
      updates['players/' + state.nick + '/lastSeen'] = firebase.database.ServerValue.TIMESTAMP;
      updates['presentRound/' + state.nick] = true;
      if(typeof state.playerProgress[state.nick] !== 'number') updates['players/' + state.nick + '/progress'] = 0;

      if(existing.owner === state.nick){
        updates['players/' + state.nick + '/joined'] = true;
        const hasDraws = Array.isArray(existing.drawnNumbers) && existing.drawnNumbers.length > 0;
        if(!hasDraws){
          updates['activeRound'] = { [state.nick]: true };
          updates['roundId'] = String(Date.now());
          updates['winner'] = '';
        } else {
          updates['presentRound/' + state.nick] = true;
      updates['activeRound/' + state.nick] = true;
      if(!state.activeRound || typeof state.activeRound !== 'object') state.activeRound = {};
      state.activeRound[state.nick] = true;
        }
      }

      return state.roomRef.update(updates);
    }).catch(() => {
      syncLocalRoomMembership();
    });

    state.roomRef.on('value', snapshot => {
      const room = normalizeRoomState(snapshot.val() || {});
      if(!room.owner) room.owner = state.nick;
      applyRemoteState(room);
    });
  }

  function syncLocalRoomMembership(){
    let room = readLocalRoomState();
    room.players = room.players.filter(name => name !== 'GRACZ' || state.nick === 'GRACZ');

    if(!room.owner || (room.owner === 'GRACZ' && state.nick !== 'GRACZ')) room.owner = state.nick;
    if(!room.players.includes(room.owner)) room.players.unshift(room.owner);
    if(!room.players.includes(state.nick)) room.players.push(state.nick);
    room.players = room.players.slice(0,8);
    room.players.forEach(name => {
      if(typeof room.joined[name] !== 'boolean') room.joined[name] = false;
    });
    room.joined[room.owner] = true;
    state.players = room.players.slice(0,8);
    saveLocalRoomState(room);
    ensurePlayerStats(state.players);
    applyRemoteState({
      owner: room.owner,
      players: room.players,
      joined: room.joined,
      progress: state.playerProgress || {},
      drawnNumbers: state.drawnNumbers,
      currentBall: state.drawnNumbers.length ? state.drawnNumbers[state.drawnNumbers.length - 1] : null,
      stats: state.stats
    });
  }

  function readLocalRoomState(){
    try {
      const raw = localStorage.getItem(roomStateKey());
      const parsed = raw ? JSON.parse(raw) : {};
      const owner = parsed.owner ? normalizeName(parsed.owner) : '';
      const players = Array.isArray(parsed.players) ? parsed.players.map(normalizeName).filter(Boolean) : [];
      const joined = parsed.joined && typeof parsed.joined === 'object' ? parsed.joined : {};
      return { owner, players, joined };
    } catch(e) {
      return { owner: '', players: [], joined: {} };
    }
  }

  function saveLocalRoomState(room){
    try { localStorage.setItem(roomStateKey(), JSON.stringify(room)); } catch(e) {}
    state.roomState = room;
  }

  function setRoomData(nick, roomCode){
    state.nick = normalizeName(nick);
    state.roomCode = String(roomCode || '').trim().slice(0,10).toUpperCase() || 'POKÓJ';
    playerNickEl.textContent = state.nick;
    roomCodeEl.textContent = state.roomCode;
    setStored('bingoNick', state.nick);
    setStored('bingoRoomCode', state.roomCode);
    setupFirebaseRoom();
  }

  function setPlayers(players){
    const clean = Array.from(new Set((players || []).map(normalizeName))).slice(0,8);
    state.players = clean.length ? clean : [state.nick];

    if(state.firebaseReady && state.roomRef){
      const updates = {};
      state.players.forEach(name => {
        updates['players/' + name + '/nick'] = name;
        updates['players/' + name + '/online'] = true;
        if(typeof state.playerProgress[name] !== 'number') updates['players/' + name + '/progress'] = 0;
        if(name === state.nick && isHost()) updates['players/' + name + '/joined'] = true;
      });
      state.roomRef.update(updates);
    } else {
      syncLocalRoomMembership();
    }

    renderPlayers(getDisplayPlayers());
    updatePlayerProgress();
    renderRanking();
    updatePrimaryButton();
  }

  function getSortedRanking(){
    const activePlayers = (state.roomState && Array.isArray(state.roomState.players) && state.roomState.players.length)
      ? state.roomState.players.slice(0,8)
      : getDisplayPlayers();
    ensurePlayerStats(activePlayers);
    return activePlayers.map(name => {
      const clean = normalizeName(name);
      const row = state.stats[clean] || { points: 0, games: 0 };
      return { name: clean, points: row.points || 0, games: row.games || 0, avg: getAverage(clean) };
    }).sort((a,b) => {
      if(b.avg !== a.avg) return b.avg - a.avg;
      if(b.points !== a.points) return b.points - a.points;
      if(a.games !== b.games) return a.games - b.games;
      return a.name.localeCompare(b.name, 'pl');
    });
  }

  function renderRanking(){
    if(!rankingRows) return;
    const rows = getSortedRanking();
    rankingRows.innerHTML = '';
    rows.forEach((row, index) => {
      const item = document.createElement('div');
      item.className = 'ranking-row';
      if(row.name === state.nick) item.classList.add('is-me');
      [String(index + 1), row.name, String(row.points), String(row.games), row.games ? row.avg.toFixed(2) : '0.00'].forEach((text, cellIndex) => {
        const span = document.createElement('span');
        span.textContent = text;
        if(cellIndex === 1) span.className = 'ranking-name';
        item.appendChild(span);
      });
      rankingRows.appendChild(item);
    });
  }

  function recordGameResult(winnerName){
    if(state.resultRecorded) return;
    const roomPlayers = getDisplayPlayers();
    ensurePlayerStats(roomPlayers);
    roomPlayers.forEach(name => state.stats[name].games += 1);
    const cleanWinner = normalizeName(winnerName || state.nick);
    ensurePlayerStats([cleanWinner]);
    state.stats[cleanWinner].points += 1;
    state.resultRecorded = true;
    saveStatsStore();

    if(state.firebaseReady && state.roomRef){
      state.roomRef.update({
        stats: state.stats,
        winner: cleanWinner,
        winnerAt: firebase.database.ServerValue.TIMESTAMP,
        activeRound: state.activeRound || {},
        drawStatus: 'finished'
      });
    }

    renderRanking();
  }

  function renderPlayers(players){
    playersPanel.innerHTML = '';
    players.slice(0,8).forEach((name, idx) => {
      const row = document.createElement('div');
      row.className = 'player-row';
      row.dataset.player = String(idx + 1);
      row.dataset.nick = name;

      const titleLine = document.createElement('div');
      titleLine.className = 'player-name-line';

      const title = document.createElement('div');
      title.className = 'player-name';
      title.textContent = name;

      const readyDot = document.createElement('i');
      readyDot.className = 'player-ready-dot';
      readyDot.classList.add(isJoinedPlayer(name) ? 'is-ready' : 'is-not-ready');

      titleLine.append(title, readyDot);

      const balls = document.createElement('div');
      balls.className = 'balls';
      for(let i = 0; i < 5; i++) balls.appendChild(document.createElement('i'));

      row.append(titleLine, balls);
      playersPanel.appendChild(row);
    });
  }

  function updateReadyDots(){
    playersPanel.querySelectorAll('.player-row').forEach(row => {
      const nick = normalizeName(row.dataset.nick || '');
      const dot = row.querySelector('.player-ready-dot');
      if(!dot) return;
      dot.classList.remove('is-ready', 'is-not-ready');
      dot.classList.add(isJoinedPlayer(nick) ? 'is-ready' : 'is-not-ready');
    });
  }

  function updatePrimaryButton(){
    if(!btnStartDraw) return;
    if(isHost()){
      btnStartDraw.textContent = 'START';
      btnStartDraw.classList.remove('btn-join-room');
    } else {
      const joinedRound = !!(state.activeRound && state.activeRound[state.nick]);
      btnStartDraw.textContent = joinedRound ? 'DOŁĄCZONO' : 'DOŁĄCZ';
      btnStartDraw.classList.add('btn-join-room');
    }
  }

  function joinCurrentPlayer(){
    if(!state.presentRound || typeof state.presentRound !== 'object') state.presentRound = {};
    if(!state.activeRound || typeof state.activeRound !== 'object') state.activeRound = {};

    state.presentRound[state.nick] = true;
    state.activeRound[state.nick] = true;

    if(state.firebaseReady && state.roomRef){
      const updates = {};
      updates['players/' + state.nick + '/nick'] = state.nick;
      updates['players/' + state.nick + '/joined'] = true;
      updates['players/' + state.nick + '/online'] = true;
      updates['players/' + state.nick + '/progress'] = state.playerProgress[state.nick] || 0;
      updates['presentRound/' + state.nick] = true;
      updates['activeRound/' + state.nick] = true;
      updates['players/' + state.nick + '/joinedAt'] = firebase.database.ServerValue.TIMESTAMP;

      renderPlayers(getDisplayPlayers());
      updatePlayerProgress();
      renderRanking();
      updatePrimaryButton();

      state.roomRef.update(updates).catch((err)=>{
        console.warn('BINGO join error:', err);
      });
      return;
    }

    let room = readLocalRoomState();
    if(!room.owner) room.owner = state.nick;
    if(!room.players.includes(room.owner)) room.players.unshift(room.owner);
    if(!room.players.includes(state.nick)) room.players.push(state.nick);
    room.players = room.players.slice(0,8);
    room.players.forEach(name => {
      if(typeof room.joined[name] !== 'boolean') room.joined[name] = false;
    });
    if(!room.presentRound || typeof room.presentRound !== 'object') room.presentRound = {};
    if(!room.activeRound || typeof room.activeRound !== 'object') room.activeRound = {};
    room.joined[room.owner] = true;
    room.joined[state.nick] = true;
    room.presentRound[state.nick] = true;
    room.activeRound[state.nick] = true;
    saveLocalRoomState(room);
    applyRemoteState({ owner: room.owner, players: room.players, joined: room.joined, presentRound: room.presentRound, activeRound: room.activeRound, progress: state.playerProgress || {}, drawnNumbers: state.drawnNumbers, stats: state.stats });
  }

  function randomNumbers(min, max, count){
    const numbers = [];
    for(let n=min; n<=max; n++) numbers.push(n);
    for(let i=numbers.length-1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers.slice(0,count).sort((a,b)=>a-b);
  }

  function createBingoCard(){
    const columns = [randomNumbers(1,15,5), randomNumbers(16,30,5), randomNumbers(31,45,5), randomNumbers(46,60,5), randomNumbers(61,75,5)];
    const card = [];
    for(let row=0; row<5; row++){
      for(let col=0; col<5; col++){
        const isFree = row===2 && col===2;
        card.push({ value: isFree ? '★' : columns[col][row], marked: isFree, free: isFree });
      }
    }
    return card;
  }

  function getMarkedIndexSet(){
    const marked = new Set();
    state.card.forEach((cell,index)=>{ if(cell.marked) marked.add(index); });
    return marked;
  }

  function getAllLines(){
    return [[0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],[0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],[0,6,12,18,24],[4,8,12,16,20]];
  }

  function getBestLineProgress(){
    const marked = getMarkedIndexSet();
    let best = 0;
    getAllLines().forEach(line => {
      let count = 0;
      line.forEach(index => { if(marked.has(index)) count++; });
      if(count > best) best = count;
    });
    return Math.max(0, Math.min(5, best));
  }

  function getWinningLine(){
    const marked = getMarkedIndexSet();
    for(const line of getAllLines()){
      if(line.every(index => marked.has(index))) return line.slice();
    }
    return [];
  }

  function syncMyProgress(progress){
    const cleanProgress = Math.max(0, Math.min(5, Number(progress) || 0));
    state.playerProgress[state.nick] = cleanProgress;
    if(state.lastSyncedProgress === cleanProgress) return;
    state.lastSyncedProgress = cleanProgress;

    if(state.firebaseReady && state.roomRef){
      const updates = {};
      updates['players/' + state.nick + '/progress'] = cleanProgress;
      state.roomRef.update(updates).catch(()=>{});
      return;
    }

    try {
      let room = readLocalRoomState();
      if(!room.progress || typeof room.progress !== 'object') room.progress = {};
      room.progress[state.nick] = cleanProgress;
      saveLocalRoomState(room);
    } catch(e) {}
  }

  function updatePlayerProgress(){
    const rows = playersPanel.querySelectorAll('.player-row');
    const myProgress = getBestLineProgress();
    syncMyProgress(myProgress);

    rows.forEach(row => {
      const nick = normalizeName(row.dataset.nick || '');
      const playerProgress = nick === state.nick
        ? myProgress
        : Math.max(0, Math.min(5, Number(state.playerProgress[nick]) || 0));

      const balls = row.querySelectorAll('.balls i');
      balls.forEach((ball,index) => {
        ball.classList.toggle('filled', index < playerProgress);
      });
    });
    updateReadyDots();
  }

  function renderWinningBoard(){
    const wrap = document.createElement('div');
    wrap.className = 'win-board';
    const winSet = new Set(state.winningLine || []);
    ['B','I','N','G','O'].forEach(letter => {
      const head = document.createElement('div');
      head.className = 'win-board-head';
      head.textContent = letter;
      wrap.appendChild(head);
    });
    state.card.forEach((cell,index) => {
      const cellEl = document.createElement('div');
      cellEl.className = 'win-board-cell';
      cellEl.textContent = cell.value;
      if(cell.marked) cellEl.classList.add('is-marked');
      if(cell.free) cellEl.classList.add('is-free');
      if(winSet.has(index)) cellEl.classList.add('is-winning');
      wrap.appendChild(cellEl);
    });
    return wrap;
  }

  function showRemoteBingoWinner(winnerName){
    stopDraws();
    if(!bingoWinMessage) return;
    const cleanWinner = normalizeName(winnerName || '');
    bingoWinMessage.innerHTML = '';
    const title = document.createElement('strong');
    title.textContent = 'BINGO!';
    const subtitle = document.createElement('span');
    subtitle.textContent = 'Wygrał: ' + cleanWinner;
    bingoWinMessage.append(title, subtitle);
    bingoWinMessage.classList.add('is-visible');
    if(state.winMessageTimer) clearTimeout(state.winMessageTimer);
    state.winMessageTimer = setTimeout(() => {
      bingoWinMessage.classList.remove('is-visible');
      bingoWinMessage.innerHTML = '';
      state.winMessageTimer = null;
    }, 2000);
  }

  function showBingoWinner(winnerName){
    stopDraws();
    state.winningLine = getWinningLine();
    state.lastRemoteWinner = normalizeName(winnerName || state.nick);
    recordGameResult(winnerName || state.nick);
    if(!bingoWinMessage) return;
    const cleanWinner = normalizeName(winnerName || state.nick);
    bingoWinMessage.innerHTML = '';
    const title = document.createElement('strong');
    title.textContent = 'BINGO!';
    const subtitle = document.createElement('span');
    subtitle.textContent = 'Wygrał: ' + cleanWinner;
    bingoWinMessage.append(title, subtitle);
    if(state.winningLine.length) bingoWinMessage.appendChild(renderWinningBoard());
    bingoWinMessage.classList.add('is-visible');
    if(state.winMessageTimer) clearTimeout(state.winMessageTimer);
    state.winMessageTimer = setTimeout(() => {
      bingoWinMessage.classList.remove('is-visible');
      bingoWinMessage.innerHTML = '';
      state.winMessageTimer = null;
    }, 3000);
  }

  function checkBingoStop(){
    if(getBestLineProgress() >= 5) showBingoWinner(state.nick);
  }

  function canMarkCell(cell){
    if(cell.free) return false;
    if(cell.marked) return true;
    return state.drawnNumbers.includes(Number(cell.value));
  }

  function renderBingoCard(){
    if(!bingoBoard) return;
    bingoBoard.innerHTML = '';
    ['B','I','N','G','O'].forEach(letter => {
      const head = document.createElement('div');
      head.className = 'bingo-head';
      head.textContent = letter;
      bingoBoard.appendChild(head);
    });
    state.card.forEach((cell,index) => {
      const button = document.createElement('button');
      button.className = 'bingo-cell';
      button.type = 'button';
      button.textContent = cell.value;
      button.dataset.index = String(index);
      if(cell.marked) button.classList.add('is-marked');
      if(cell.free) button.classList.add('is-free');
      button.addEventListener('click', () => {
        if(!canMarkCell(cell)) return;
        cell.marked = !cell.marked;
        button.classList.toggle('is-marked', cell.marked);
        updatePlayerProgress();
        checkBingoStop();
      });
      bingoBoard.appendChild(button);
    });
  }

  function allNumbers(){
    const numbers = [];
    for(let n=1; n<=75; n++) numbers.push(n);
    return numbers;
  }

  function remainingNumbers(){
    const used = new Set(state.drawnNumbers);
    return allNumbers().filter(n => !used.has(n));
  }

  function renderDrawnNumbers(){
    if(!drawnNumbersEl) return;
    drawnNumbersEl.innerHTML = '';
    state.drawnNumbers.forEach(number => {
      const item = document.createElement('span');
      item.className = 'drawn-number';
      item.textContent = number;
      drawnNumbersEl.appendChild(item);
    });
  }

  function resetDrawMachine(){
    state.drawnNumbers = [];
    state.bingoFinished = false;
    state.isDrawing = false;
    state.winningLine = [];
    state.resultRecorded = false;
    state.playerProgress[state.nick] = 0;
    state.lastSyncedProgress = -1;
    if(state.drawTimer){ clearTimeout(state.drawTimer); state.drawTimer = null; }
    if(state.drawSpinTimer){ clearInterval(state.drawSpinTimer); state.drawSpinTimer = null; }
    if(drawBall){ drawBall.classList.remove('is-spinning'); drawBall.textContent = '?'; }
    renderDrawnNumbers();
    if(bingoWinMessage){ bingoWinMessage.classList.remove('is-visible'); bingoWinMessage.innerHTML = ''; }

    if(state.firebaseReady && state.roomRef && isHost()){
      const newActiveRound = {};
      newActiveRound[state.nick] = true;
      state.activeRound = newActiveRound;
      state.lastRemoteWinner = '';
      state.presentRound = newActiveRound;
      state.roomRef.update({ drawnNumbers: [], currentBall: null, drawStatus: 'idle', winner: '', winnerAt: null, roundId: String(Date.now()), activeRound: newActiveRound, presentRound: newActiveRound });
    }
  }

  function startAutoDraw(){
    if(state.bingoFinished) return;
    if(state.drawTimer){ clearTimeout(state.drawTimer); state.drawTimer = null; }
    state.drawTimer = setTimeout(drawNextNumber, 5000);
  }

  function drawNextNumber(){
    if(state.bingoFinished || state.isDrawing) return;
    const available = remainingNumbers();
    if(!available.length){ state.bingoFinished = true; return; }
    state.isDrawing = true;

    if(drawBall){ drawBall.classList.add('is-spinning'); drawBall.textContent = '?'; }
    if(state.drawSpinTimer){ clearInterval(state.drawSpinTimer); state.drawSpinTimer = null; }

    state.drawSpinTimer = setInterval(() => {
      if(!drawBall) return;
      drawBall.textContent = String(available[Math.floor(Math.random()*available.length)]);
    }, 90);

    setTimeout(() => {
      if(state.drawSpinTimer){ clearInterval(state.drawSpinTimer); state.drawSpinTimer = null; }
      const finalNumber = available[Math.floor(Math.random()*available.length)];
      state.drawnNumbers.push(finalNumber);
      if(drawBall){ drawBall.classList.remove('is-spinning'); drawBall.textContent = String(finalNumber); }
      renderDrawnNumbers();
      state.isDrawing = false;

      if(state.firebaseReady && state.roomRef && isHost()){
        state.roomRef.update({
          drawnNumbers: state.drawnNumbers,
          currentBall: finalNumber,
          drawStatus: 'running'
        });
      }

      if(!state.bingoFinished) startAutoDraw();
    }, 3000);
  }

  function stopDraws(){
    state.bingoFinished = true;
    if(state.drawTimer){ clearTimeout(state.drawTimer); state.drawTimer = null; }
    if(state.drawSpinTimer){ clearInterval(state.drawSpinTimer); state.drawSpinTimer = null; }
    if(drawBall) drawBall.classList.remove('is-spinning');
  }

  function newGameCard(){
    resetDrawMachine();
    state.card = createBingoCard();
    renderBingoCard();
    updatePlayerProgress();
    renderRanking();
  }

  function openGame(){
    setRoomData(state.nick, state.roomCode);
    setPlayers(state.players.length ? state.players : [state.nick]);
    newGameCard();
    showScreen('game');
  }

  function leaveBingoPresence(){
    if(state.firebaseReady && state.roomRef){
      const updates = {};
      updates['presentRound/' + state.nick] = null;
      updates['activeRound/' + state.nick] = null;
      updates['players/' + state.nick + '/joined'] = false;
      updates['players/' + state.nick + '/online'] = false;
      state.roomRef.update(updates).catch(()=>{});
    }
    if(state.presentRound) delete state.presentRound[state.nick];
    if(state.activeRound) delete state.activeRound[state.nick];
  }

  function exitToGameRoom(){
    leaveBingoPresence();
    let savedReturn = '';
    try {
      savedReturn = params.get('return') || localStorage.getItem('bingoReturnUrl') || '';
    } catch(e) {}
    const fallback = new URL('../../index.html', window.location.href).href + '?open=games&room=' + encodeURIComponent(state.roomCode || '');
    const target = window.BINGO_EXIT_URL || savedReturn || fallback;
    try {
      if(window.parent && window.parent !== window){
        window.parent.postMessage({type:'BINGO_EXIT', version: VERSION, target:'games', room: state.roomCode}, '*');
        return;
      }
    } catch(e) {}
    window.location.href = target;
  }

  function clearOldCache(){
    if('caches' in window){
      caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))).catch(()=>{});
    }
    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.map(reg => reg.unregister()))).catch(()=>{});
    }
  }

  btnPlay.addEventListener('click', openGame);
  btnStartDraw.addEventListener('click', () => {
    if(isHost()){
      if(state.bingoFinished) return;
      if(state.isDrawing || state.drawTimer) return;
      drawNextNumber();
    } else {
      if(state.activeRound && state.activeRound[state.nick]){
        updatePrimaryButton();
        return;
      }
      joinCurrentPlayer();
    }
  });
  btnExitStart.addEventListener('click', exitToGameRoom);
  btnExitGame.addEventListener('click', () => {
    stopDraws();
    showScreen('start');
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') showScreen('start');
  });

  window.addEventListener('storage', (event) => {
    if(event.key !== roomStateKey()) return;
    syncLocalRoomMembership();
  });

  window.addEventListener('beforeunload', leaveBingoPresence);

  window.BingoGame = {
    version: VERSION,
    setRoomData,
    setPlayers,
    openGame,
    showStart: () => showScreen('start'),
    newGameCard,
    stopDraws,
    updatePlayerProgress,
    showBingoWinner,
    renderRanking,
    joinCurrentPlayer
  };

  setRoomData(state.nick, state.roomCode);
  ensurePlayerStats([state.nick]);
  renderPlayers(getDisplayPlayers());
  updatePlayerProgress();
  renderRanking();
  updatePrimaryButton();
  clearOldCache();
  showScreen('start');
})();
