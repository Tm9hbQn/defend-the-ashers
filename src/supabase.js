// Supabase client — using REST API directly (no npm dependency needed)
const SUPABASE_URL = 'https://iwfqaxyhxwylxsjubrkm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZnFheHloeHd5bHhzanVicmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjA3OTYsImV4cCI6MjA4ODgzNjc5Nn0.zBMSd-4Pqabjefm10Ei02iSdQqxZb4uVziXVA64XBlI';

const HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
};

/**
 * Fetch top 10 scores for the leaderboard.
 * @returns {Promise<Array<{player_name, score, level_reached}>>}
 */
export async function fetchLeaderboard() {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/high_scores?select=player_name,score,level_reached&order=score.desc&limit=10`,
            { headers: HEADERS }
        );
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

/**
 * Get the personal best score for a given player name.
 * @param {string} playerName
 * @returns {Promise<number>} the best score, or 0 if none
 */
export async function getPersonalBest(playerName) {
    try {
        const name = encodeURIComponent(playerName);
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/high_scores?player_name=eq.${name}&select=score&order=score.desc&limit=1`,
            { headers: HEADERS }
        );
        if (!res.ok) return 0;
        const rows = await res.json();
        return rows.length ? rows[0].score : 0;
    } catch {
        return 0;
    }
}

/**
 * Submit a score. Only sends if it's higher than the player's existing best.
 * @param {string} playerName
 * @param {number} score
 * @param {number} levelReached
 * @returns {Promise<boolean>} true if submitted
 */
export async function submitScore(playerName, score, levelReached) {
    if (!playerName || score <= 0) return false;
    try {
        const best = await getPersonalBest(playerName);
        if (score <= best) return false; // not a new high score for this player

        const res = await fetch(`${SUPABASE_URL}/rest/v1/high_scores`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ player_name: playerName, score, level_reached: levelReached }),
        });
        return res.ok || res.status === 201;
    } catch {
        return false;
    }
}
