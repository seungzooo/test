// 데이터 계층: Supabase 가 설정되어 있으면 Supabase, 아니면 localStorage 사용
(function () {
  const cfg = window.SUPABASE_CONFIG || {};
  const useSupabase = !!(cfg.url && cfg.anonKey && window.supabase);
  const client = useSupabase ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;

  const LS_SCORES = 'mole_scores';
  const LS_REVIEWS = 'mole_reviews';

  function lsGet(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
  }

  window.DB = {
    mode: useSupabase ? 'supabase' : 'local',

    async getTopScores(limit = 10) {
      if (client) {
        const { data, error } = await client
          .from('scores')
          .select('player_name, score, created_at')
          .order('score', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(limit);
        if (error) throw error;
        return data;
      }
      return lsGet(LS_SCORES)
        .sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at))
        .slice(0, limit);
    },

    async addScore(player_name, score) {
      if (client) {
        const { error } = await client.from('scores').insert({ player_name, score });
        if (error) throw error;
        return;
      }
      const list = lsGet(LS_SCORES);
      list.push({ player_name, score, created_at: new Date().toISOString() });
      lsSet(LS_SCORES, list);
    },

    async getReviews(limit = 20) {
      if (client) {
        const { data, error } = await client
          .from('reviews')
          .select('player_name, rating, comment, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        return data;
      }
      return lsGet(LS_REVIEWS)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit);
    },

    async addReview(player_name, rating, comment) {
      if (client) {
        const { error } = await client.from('reviews').insert({ player_name, rating, comment });
        if (error) throw error;
        return;
      }
      const list = lsGet(LS_REVIEWS);
      list.push({ player_name, rating, comment, created_at: new Date().toISOString() });
      lsSet(LS_REVIEWS, list);
    },
  };
})();
