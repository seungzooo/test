(function () {
  const GAME_SECONDS = 30;
  const HOLE_COUNT = 9;
  const MAX_LIFE = 3;

  const $ = (id) => document.getElementById(id);
  const boardEl = $('board');
  const scoreEl = $('score');
  const timeEl = $('time');
  const heartsEl = $('hearts');
  const bestEl = $('best');
  const statusEl = $('status-line');
  const startBtn = $('start-btn');
  const soundBtn = $('sound-btn');
  const modal = $('modal');
  const finalScoreEl = $('final-score');

  const MOLES = [
    { emoji: '👹', pts: 10, type: 'mole' },   // 모블린
    { emoji: '🐙', pts: 15, type: 'mole' },   // 옥토락
    { emoji: '🦇', pts: 20, type: 'mole' },   // 키즈
    { emoji: '💣', pts: 0, type: 'bomb' },    // 폭탄 (생명 -1)
    { emoji: '🧚', pts: 30, type: 'fairy' },  // 요정 (보너스)
  ];

  let score = 0, timeLeft = GAME_SECONDS, life = MAX_LIFE;
  let running = false;
  let timerId = null, spawnId = null;
  let soundOn = true;
  let bestScore = Number(localStorage.getItem('mole_best') || 0);
  bestEl.textContent = bestScore;

  // ===== Sound (WebAudio, 외부 파일 없이) =====
  let audioCtx = null;
  function beep(freq, dur = 0.08, type = 'square', vol = 0.08) {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch { /* ignore */ }
  }
  const sfx = {
    hit: () => { beep(880, 0.06); setTimeout(() => beep(1320, 0.08), 60); },
    bomb: () => beep(110, 0.3, 'sawtooth', 0.12),
    fairy: () => { [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => beep(f, 0.1, 'triangle'), i * 70)); },
    start: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.12), i * 100)); },
    over: () => { [784, 659, 523, 392].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'triangle'), i * 160)); },
  };
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? '🔊 소리' : '🔇 소리';
  });

  // ===== Board =====
  const holes = [];
  for (let i = 0; i < HOLE_COUNT; i++) {
    const hole = document.createElement('div');
    hole.className = 'hole';
    hole.dataset.idx = i;
    const mole = document.createElement('div');
    mole.className = 'mole';
    hole.appendChild(mole);
    hole.addEventListener('pointerdown', onWhack);
    boardEl.appendChild(hole);
    holes.push({ el: hole, moleEl: mole, active: null, hideId: null });
  }

  function showPop(hole, text, bad) {
    const p = document.createElement('span');
    p.className = 'pop' + (bad ? ' bad' : '');
    p.textContent = text;
    hole.el.appendChild(p);
    setTimeout(() => p.remove(), 650);
  }

  function hideMole(h) {
    clearTimeout(h.hideId);
    h.hideId = null;
    h.active = null;
    h.el.classList.remove('up', 'hit', 'boom');
  }

  function spawn() {
    if (!running) return;
    const free = holes.filter((h) => !h.active);
    if (free.length) {
      const h = free[Math.floor(Math.random() * free.length)];
      const r = Math.random();
      let m;
      if (r < 0.15) m = MOLES[3];        // bomb
      else if (r < 0.22) m = MOLES[4];   // fairy
      else m = MOLES[Math.floor(Math.random() * 3)];
      h.active = m;
      h.moleEl.textContent = m.emoji;
      h.el.classList.add('up');

      // 난이도: 시간이 갈수록 빨리 숨음
      const elapsed = GAME_SECONDS - timeLeft;
      const upTime = Math.max(450, 1100 - elapsed * 20);
      h.hideId = setTimeout(() => hideMole(h), upTime);
    }
    const elapsed = GAME_SECONDS - timeLeft;
    const nextIn = Math.max(300, 800 - elapsed * 15);
    spawnId = setTimeout(spawn, nextIn);
  }

  function onWhack(e) {
    if (!running) return;
    const h = holes[Number(e.currentTarget.dataset.idx)];
    if (!h.active) return;
    const m = h.active;
    clearTimeout(h.hideId);
    h.active = null;

    if (m.type === 'bomb') {
      life -= 1;
      renderHearts();
      sfx.bomb();
      showPop(h, '-♥', true);
      h.el.classList.remove('up');
      h.el.classList.add('boom');
      setTimeout(() => h.el.classList.remove('boom'), 600);
      if (life <= 0) endGame();
      return;
    }

    score += m.pts;
    scoreEl.textContent = score;
    if (m.type === 'fairy') sfx.fairy(); else sfx.hit();
    showPop(h, '+' + m.pts);
    h.el.classList.add('hit');
    setTimeout(() => h.el.classList.remove('up', 'hit'), 150);
  }

  function renderHearts() {
    heartsEl.textContent = '♥'.repeat(life) + '♡'.repeat(MAX_LIFE - life);
  }

  // ===== Game flow =====
  function startGame() {
    score = 0; timeLeft = GAME_SECONDS; life = MAX_LIFE;
    scoreEl.textContent = '0';
    timeEl.textContent = timeLeft;
    renderHearts();
    holes.forEach(hideMole);
    running = true;
    startBtn.disabled = true;
    statusEl.textContent = '용사여, 두더지를 잡아라!';
    sfx.start();

    timerId = setInterval(() => {
      timeLeft -= 1;
      timeEl.textContent = timeLeft;
      if (timeLeft <= 0) endGame();
    }, 1000);
    spawn();
  }

  function endGame() {
    if (!running) return;
    running = false;
    clearInterval(timerId);
    clearTimeout(spawnId);
    holes.forEach(hideMole);
    startBtn.disabled = false;
    statusEl.textContent = life <= 0 ? '폭탄에 당했다...' : '시간 종료!';
    sfx.over();

    if (score > bestScore) {
      bestScore = score;
      bestEl.textContent = bestScore;
      localStorage.setItem('mole_best', String(bestScore));
    }
    finalScoreEl.textContent = score;
    $('player-name').value = localStorage.getItem('mole_name') || '';
    modal.classList.remove('hidden');
    setTimeout(() => $('player-name').focus(), 50);
  }

  startBtn.addEventListener('click', startGame);

  // ===== Score submit =====
  $('score-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('player-name').value.trim();
    if (!name) return;
    localStorage.setItem('mole_name', name);
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      await DB.addScore(name, score);
      modal.classList.add('hidden');
      await loadLeaderboard();
    } catch (err) {
      alert('점수 저장 실패: ' + (err.message || err));
    } finally {
      btn.disabled = false;
    }
  });
  $('skip-btn').addEventListener('click', () => modal.classList.add('hidden'));

  // ===== Leaderboard =====
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('ko-KR');
  }

  async function loadLeaderboard() {
    const el = $('leaderboard');
    try {
      const rows = await DB.getTopScores(10);
      if (!rows.length) { el.innerHTML = '<li class="muted">아직 기록이 없습니다. 첫 용사가 되어보세요!</li>'; return; }
      el.innerHTML = rows.map((r, i) =>
        `<li><span><span class="rank">${i + 1}.</span>${escapeHtml(r.player_name)}</span><span class="pts">${r.score}</span></li>`
      ).join('');
    } catch (err) {
      el.innerHTML = `<li class="muted">불러오기 실패: ${escapeHtml(err.message || err)}</li>`;
    }
  }

  // ===== Reviews =====
  const starBtns = Array.from($('stars').querySelectorAll('button'));
  function setRating(v) {
    $('review-rating').value = v;
    starBtns.forEach((b) => b.classList.toggle('on', Number(b.dataset.v) <= v));
  }
  starBtns.forEach((b) => b.addEventListener('click', () => setRating(Number(b.dataset.v))));
  setRating(5);

  async function loadReviews() {
    const el = $('reviews');
    try {
      const rows = await DB.getReviews(20);
      if (!rows.length) { el.innerHTML = '<li class="muted">첫 리뷰를 남겨주세요!</li>'; return; }
      el.innerHTML = rows.map((r) =>
        `<li><div class="meta"><span>${escapeHtml(r.player_name)} ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span><time>${fmtDate(r.created_at)}</time></div><div class="body">${escapeHtml(r.comment)}</div></li>`
      ).join('');
    } catch (err) {
      el.innerHTML = `<li class="muted">불러오기 실패: ${escapeHtml(err.message || err)}</li>`;
    }
  }

  $('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('review-name').value.trim();
    const rating = Number($('review-rating').value);
    const comment = $('review-comment').value.trim();
    if (!name || !comment) return;
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      await DB.addReview(name, rating, comment);
      $('review-comment').value = '';
      await loadReviews();
    } catch (err) {
      alert('리뷰 저장 실패: ' + (err.message || err));
    } finally {
      btn.disabled = false;
    }
  });

  // ===== Init =====
  $('db-status').textContent = DB.mode === 'supabase'
    ? '☁ Supabase 연결됨'
    : '💾 로컬 모드 (supabase-config.js 에 키를 넣으면 온라인 저장)';
  $('review-name').value = localStorage.getItem('mole_name') || '';
  renderHearts();
  loadLeaderboard();
  loadReviews();
})();
