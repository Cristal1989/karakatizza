const HISTORY_DAYS = 14;
const HISTORY_LIMIT = 50;
const MAX_JSON_BYTES = 80000;
const HISTORY_MAX_CHARS = 24000;

const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const shortText = (value, max = 200) =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";

function isValidContentBlock(value) {
  if (!object(value)) return false;

  return ["text", "caption", "idea", "topic", "title", "objective"].some(
    (key) => typeof value[key] === "string" && value[key].trim().length > 0
  );
}

export function validatePlan(body) {
  if (!object(body)) {
    return "Expected a JSON object";
  }

  const allowed = ["contentDate", "stories", "post", "products", "rawPlan"];

  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    return "Allowed fields: contentDate, stories, post, products, rawPlan";
  }

  const serialized = JSON.stringify(body);

  if (
    serialized.length > MAX_JSON_BYTES ||
    Buffer.byteLength(serialized, "utf8") > MAX_JSON_BYTES
  ) {
    return "Plan must not exceed 80000 UTF-8 bytes";
  }

  if (
    typeof body.contentDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.contentDate) ||
    body.contentDate < "0001-01-01"
  ) {
    return "contentDate must be YYYY-MM-DD";
  }

  const date = new Date(`${body.contentDate}T00:00:00.000Z`);

  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== body.contentDate
  ) {
    return "contentDate must be a valid calendar date";
  }

  if (
    !Array.isArray(body.stories) ||
    body.stories.length < 1 ||
    body.stories.length > 5 ||
    !body.stories.every(isValidContentBlock)
  ) {
    return "stories must contain 1-5 objects with text, caption, idea, topic, title or objective";
  }

  if (body.post != null && !isValidContentBlock(body.post)) {
    return "post must be null or an object with text, caption, idea, topic, title or objective";
  }

  if (
    !Array.isArray(body.products) ||
    body.products.length > 30 ||
    !body.products.every(
      (value) =>
        object(value) &&
        typeof value.id === "string" &&
        value.id.trim().length > 0 &&
        value.id.length <= 128 &&
        (value.name == null ||
          (typeof value.name === "string" && value.name.length <= 200)) &&
        Object.keys(value).every((key) => ["id", "name"].includes(key))
    )
  ) {
    return "products must be an array of up to 30 {id: string, name?: string} objects";
  }

  if (body.rawPlan != null && !object(body.rawPlan)) {
    return "rawPlan must be an object";
  }

  return null;
}

export async function savePlan(db, body) {
  const result = await db.query(
    `
      INSERT INTO smm_content_plans
        (content_date, status, stories, post, products, raw_plan)
      VALUES ($1::date, 'pending', $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb)
      RETURNING id::text AS id, status
    `,
    [
      body.contentDate,
      JSON.stringify(body.stories),
      body.post == null ? null : JSON.stringify(body.post),
      JSON.stringify(body.products),
      JSON.stringify(body.rawPlan ?? body),
    ]
  );

  return result.rows[0];
}

export function validPlanId(id) {
  return (
    typeof id === "string" &&
    /^[1-9]\d{0,18}$/.test(id) &&
    BigInt(id) <= 9223372036854775807n
  );
}

export async function changePlanStatus(db, id, status) {
  const result = await db.query(
    `
      UPDATE smm_content_plans
      SET status = $2
      WHERE id = $1::bigint
        AND status = 'pending'
      RETURNING id::text AS id, status
    `,
    [id, status]
  );

  return result.rows[0] ?? null;
}

function summarizeContent(value) {
  if (!object(value)) return null;

  return Object.fromEntries(
    ["title", "topic", "idea", "objective", "text", "caption"]
      .map((key) => [key, shortText(value[key])])
      .filter(([, value]) => value)
  );
}

export async function getContentHistory(db) {
  const result = await db.query(
    `
      SELECT
        id::text AS id,
        to_char(content_date, 'YYYY-MM-DD') AS "contentDate",
        status,
        stories,
        post,
        products
      FROM smm_content_plans
      WHERE content_date >=
        (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Kyiv')::date - ($1::int - 1)
        AND content_date <=
        (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Kyiv')::date
      ORDER BY content_date DESC, id DESC
      LIMIT $2
    `,
    [HISTORY_DAYS, HISTORY_LIMIT + 1]
  );

  const candidates = result.rows.slice(0, HISTORY_LIMIT).map((row) => ({
    id: row.id,
    contentDate: row.contentDate,
    status: row.status,
    products: (Array.isArray(row.products) ? row.products : [])
      .slice(0, 30)
      .filter(object)
      .map((value) => ({
        id: shortText(value.id, 128),
        name: shortText(value.name),
      }))
      .filter((value) => value.id),
    stories: (Array.isArray(row.stories) ? row.stories : [])
      .slice(0, 5)
      .map(summarizeContent)
      .filter(Boolean),
    post: summarizeContent(row.post),
  }));

  const items = [];
  let length = 0;

  for (const item of candidates) {
    const size = JSON.stringify(item).length;

    if (length + size > HISTORY_MAX_CHARS) {
      break;
    }

    items.push(item);
    length += size;
  }

  return {
    days: HISTORY_DAYS,
    truncated: result.rows.length > items.length,
    items,
  };
}
