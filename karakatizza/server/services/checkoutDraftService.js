import crypto from "crypto";

function generateDraftToken() {
  return `chk_${crypto.randomBytes(16).toString("hex")}`;
}

export async function createCheckoutDraft(pool, payload) {
  const token = generateDraftToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  const result = await pool.query(
    `
      INSERT INTO checkout_drafts (
        token,
        payload,
        expires_at
      )
      VALUES ($1, $2::jsonb, $3)
      RETURNING id, token, payload, created_at, expires_at
    `,
    [token, JSON.stringify(payload || {}), expiresAt]
  );

  return result.rows[0];
}

export async function getCheckoutDraftByToken(pool, token) {
  const result = await pool.query(
    `
      SELECT id, token, payload, created_at, expires_at
      FROM checkout_drafts
      WHERE token = $1
        AND expires_at > NOW()
      LIMIT 1
    `,
    [token]
  );

  return result.rows[0] || null;
}

export async function deleteCheckoutDraftByToken(pool, token) {
  await pool.query(
    `
      DELETE FROM checkout_drafts
      WHERE token = $1
    `,
    [token]
  );
}

export async function cleanupExpiredCheckoutDrafts(pool) {
  await pool.query(
    `
      DELETE FROM checkout_drafts
      WHERE expires_at <= NOW()
    `
  );
}