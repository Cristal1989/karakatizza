import TelegramBot from "node-telegram-bot-api";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL =
  process.env.TELEGRAM_CRM_API_URL || "http://localhost:5000";

let botInstance = null;

function buildGuestKeyboard() {
  return {
    keyboard: [
      [{ text: "Підтвердити номер", request_contact: true }],
      [{ text: "Мій бонус" }],
      [{ text: "Допомога" }],
    ],
    resize_keyboard: true,
    persistent: true,
  };
}

function buildLinkedKeyboard() {
  return {
    keyboard: [
      [{ text: "Мій бонус" }],
      [{ text: "Акції" }],
      [{ text: "Допомога" }],
    ],
    resize_keyboard: true,
    persistent: true,
  };
}

function buildMainKeyboard(isLinked = false) {
  return isLinked ? buildLinkedKeyboard() : buildGuestKeyboard();
}

async function getCustomerByTelegramUserId(telegramUserId) {
  if (!telegramUserId) return null;

  const response = await fetch(
    `${API_BASE_URL}/api/crm/telegram/customer/${telegramUserId}`
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data?.customer || null;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 300)}`);
  }

  if (!response.ok) {
    throw new Error(data?.message || "HTTP request failed");
  }

  return data;
}

async function getJson(url) {
  const response = await fetch(url);
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 300)}`);
  }

  if (!response.ok) {
    throw new Error(data?.message || "HTTP request failed");
  }

  return data;
}

async function handleHelp(bot, msg) {
  try {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id ? String(msg.from.id) : "";
    const customer = await getCustomerByTelegramUserId(telegramUserId);
    const isLinked = Boolean(customer?.telegram_user_id);

    await bot.sendMessage(
      chatId,
      `Я можу допомогти з такими діями:

• перевірити, чи є в тебе бонус
• показати актуальні акції
• підтвердити номер телефону для прив'язки Telegram

Якщо щось не працює — просто спробуй ще раз або звернись до нас напряму.`,
      {
        reply_markup: buildMainKeyboard(isLinked),
      }
    );
  } catch (error) {
    console.error("TELEGRAM HELP ERROR:", error);

    await bot.sendMessage(
      msg.chat.id,
      `Сталася помилка. Спробуй ще раз трохи пізніше.`,
      {
        reply_markup: buildMainKeyboard(false),
      }
    );
  }
}

async function handleMyBonus(bot, msg) {
  try {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id ? String(msg.from.id) : "";

    const customer = await getCustomerByTelegramUserId(telegramUserId);

    if (!customer) {
      await bot.sendMessage(
        chatId,
        `Я ще не бачу прив'язаний номер телефону 🙄

Натисни "Підтвердити номер", щоб я зміг знайти твій профіль і перевірити бонус.`,
        {
          reply_markup: buildMainKeyboard(false),
        }
      );
      return;
    }

    const result = await getJson(
      `${API_BASE_URL}/api/crm/telegram/bonus/${telegramUserId}`
    );

    const gift = result?.gift || null;

    if (!gift) {
      await bot.sendMessage(
        chatId,
        `Зараз у тебе немає активного бонусу.

Якщо з'являться нові акції — я напишу тобі тут у Telegram.`,
        {
          reply_markup: buildMainKeyboard(true),
        }
      );
      return;
    }

    if (gift.status === "used") {
      await bot.sendMessage(
        chatId,
        `✅ Бонус уже був використаний

Подарунок: ${gift.gift_roll_title || "Подарунковий рол"}

Якщо з'являться нові акції — я напишу тобі тут у Telegram.`,
        {
          reply_markup: buildMainKeyboard(true),
        }
      );
      return;
    }

    await bot.sendMessage(
      chatId,
      `🎁 У тебе є активний бонус

Подарунок: ${gift.gift_roll_title || "Подарунковий рол"}
Статус: активний

Він уже закріплений за твоїм номером і буде використаний при наступному замовленні.`,
      {
        reply_markup: buildMainKeyboard(true),
      }
    );
  } catch (error) {
    console.error("TELEGRAM MY BONUS ERROR:", error);

    await bot.sendMessage(
      msg.chat.id,
      `Не вдалося перевірити бонус. Спробуй ще раз трохи пізніше.`,
      {
        reply_markup: buildMainKeyboard(true),
      }
    );
  }
}
async function handleContact(bot, msg) {
  const chatId = msg.chat.id;
  const telegramUserId = String(msg.from?.id || "");
  const telegramUsername = msg.from?.username || "";
  const telegramFirstName = msg.from?.first_name || "";
  const contact = msg.contact;

  if (!contact?.phone_number) {
    await bot.sendMessage(
      chatId,
      'Не вдалося отримати номер телефону. Спробуй ще раз через кнопку "Підтвердити номер".',
      {
        reply_markup: buildMainKeyboard(),
      }
    );
    return;
  }

  if (String(contact.user_id || "") !== telegramUserId) {
    await bot.sendMessage(
      chatId,
      "Будь ласка, надішли саме свій номер через кнопку Telegram, а не чужий контакт.",
      {
        reply_markup: buildMainKeyboard(),
      }
    );
    return;
  }

  try {
    const linkResult = await postJson(`${API_BASE_URL}/api/crm/telegram/link`, {
      phone: contact.phone_number,
      telegramUserId,
      telegramUsername,
      telegramFirstName,
    });

    if (!linkResult?.success || !linkResult?.customer) {
      await bot.sendMessage(
        chatId,
        "Не вдалося прив'язати Telegram до клієнта. Спробуй пізніше.",
        {
          reply_markup: buildMainKeyboard(),
        }
      );
      return;
    }

    const customer = linkResult.customer;

    let issueResult = null;
    try {
      issueResult = await postJson(
        `${API_BASE_URL}/api/crm/telegram-gifts/issue`,
        {
          customerId: customer.id,
          phone: customer.phone,
          giftRollId: "telegram-welcome",
          giftRollTitle: "Подарунковий рол",
          comment: "Telegram welcome gift",
        }
      );
    } catch (issueError) {
      console.error("TELEGRAM ISSUE ERROR:", issueError);
    }

    if (issueResult?.created === true) {
      await bot.sendMessage(
        chatId,
        `Готово ✅

Твій номер підтверджено.
Telegram успішно прив'язаний до профілю.

🎁 Одноразовий бонус за підписку нараховано.
Він закріплений за твоїм номером і буде використаний при наступному замовленні.`,
        {
          reply_markup: buildMainKeyboard(true),
        }
      );
      return;
    }

    if (
      issueResult?.created === false &&
      (issueResult?.reason === "active_gift_exists" ||
        issueResult?.reason === "welcome_gift_already_issued")
    ) {
      await bot.sendMessage(
        chatId,
        `Номер підтверджено ✅
    
    Telegram уже прив'язаний до твого профілю.
    🎁 Бонус за підписку вже був нарахований раніше. Повторно ця акція не надається.`,
        {
          reply_markup: buildMainKeyboard(true),
        }
      );
      return;
    }

    await bot.sendMessage(
      chatId,
      `Номер підтверджено ✅

Telegram прив'язаний до твого профілю.
Якщо бонус зараз не відобразився, ми перевіримо це вручну.`,
      {
        reply_markup: buildMainKeyboard(),
      }
    );
  } catch (error) {
    console.error("TELEGRAM CONTACT FLOW ERROR:", error);

    const messageText =
      error?.message === "Клієнта з таким номером не знайдено"
        ? `Я не знайшов замовлень з цим номером у базі 😕
Перевір, чи саме цей номер ти вказував при оформленні замовлення.`
        : "Сталася помилка під час підтвердження номера. Спробуй трохи пізніше.";

    await bot.sendMessage(chatId, messageText, {
      reply_markup: buildMainKeyboard(),
    });
  }
}

export function startTelegramBot() {
  if (!BOT_TOKEN) {
    console.log("Telegram bot disabled: TELEGRAM_BOT_TOKEN is missing");
    return null;
  }

  if (botInstance) {
    return botInstance;
  }

  const bot = new TelegramBot(BOT_TOKEN, {
    polling: true,
  });

  function buildGuestKeyboard() {
    return {
      keyboard: [
        [{ text: "Підтвердити номер", request_contact: true }],
        [{ text: "Мій бонус" }],
        [{ text: "Допомога" }],
      ],
      resize_keyboard: true,
      persistent: true,
    };
  }

  function buildLinkedKeyboard() {
    return {
      keyboard: [
        [{ text: "Мій бонус" }],
        [{ text: "Акції" }],
        [{ text: "Допомога" }],
      ],
      resize_keyboard: true,
      persistent: true,
    };
  }

  function buildMainKeyboard(isLinked = false) {
    return isLinked ? buildLinkedKeyboard() : buildGuestKeyboard();
  }

  async function getCustomerByTelegramUserId(telegramUserId) {
    if (!telegramUserId) return null;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/crm/telegram/customer/${telegramUserId}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data?.customer || null;
    } catch (error) {
      console.error("GET CUSTOMER BY TELEGRAM USER ID ERROR:", error);
      return null;
    }
  }

  bot.onText(/\/start/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const telegramUserId = msg.from?.id ? String(msg.from.id) : "";
      const firstName = msg.from?.first_name || "друже";

      const customer = await getCustomerByTelegramUserId(telegramUserId);
      const isLinked = Boolean(customer?.telegram_user_id);

      if (isLinked) {
        await bot.sendMessage(
          chatId,
          `Привіт, ${firstName}! 👋

Telegram уже прив'язаний до твого профілю в Karakatizza.

Що хочеш зробити далі?`,
          {
            reply_markup: buildMainKeyboard(true),
          }
        );
        return;
      }

      await bot.sendMessage(
        chatId,
        `Привіт, ${firstName}! 👋

Підтверди свій номер телефону, який ти вказував у замовленні в Karakatizza, і ми закріпимо за тобою Telegram-профіль.

🎁 За перше підтвердження номера — одноразовий бонус до наступного замовлення.

Натисни кнопку нижче:`,
        {
          reply_markup: buildMainKeyboard(false),
        }
      );
    } catch (error) {
      console.error("TELEGRAM /start ERROR:", error);
    }
  });

  bot.on("message", async (msg) => {
    const text = msg.text || "";

    if (text === "/start") {
      return;
    }

    if (text === "Допомога") {
      await handleHelp(bot, msg);
      return;
    }

    if (text === "Мій бонус") {
      await handleMyBonus(bot, msg);
      return;
    }

    if (text === "Акції") {
      try {
        const chatId = msg.chat.id;
        const telegramUserId = msg.from?.id ? String(msg.from.id) : "";
        const customer = await getCustomerByTelegramUserId(telegramUserId);
        const isLinked = Boolean(customer?.telegram_user_id);

        await bot.sendMessage(
          chatId,
          `🔥 Актуальні акції Karakatizza

Слідкуй за нашими пропозиціями на сайті та в Telegram.
Скоро тут можна буде показувати персональні акції саме для тебе 🍣`,
          {
            reply_markup: buildMainKeyboard(isLinked),
          }
        );
      } catch (error) {
        console.error("TELEGRAM АКЦІЇ ERROR:", error);
      }
      return;
    }

    if (msg.contact) {
      await handleContact(bot, msg);
      return;
    }
  });

  bot.on("polling_error", (error) => {
    console.error("TELEGRAM POLLING ERROR:", error?.message || error);
  });

  console.log("Telegram bot started");
  botInstance = bot;
  return botInstance;
}

export async function sendTelegramTextToUser(
  telegramUserId,
  text,
  context = {}
) {
  if (!botInstance) {
    throw new Error("Telegram bot is not started");
  }

  if (!telegramUserId) {
    throw new Error("telegramUserId is required");
  }

  if (!text || !text.trim()) {
    throw new Error("Message text is required");
  }

  const safeName = String(context?.name || "").trim() || "друже";
  const isLinked = Boolean(context?.isLinked);

  const finalText = text.replaceAll("{{name}}", safeName).trim();

  const result = await botInstance.sendMessage(
    String(telegramUserId),
    finalText,
    {
      reply_markup: buildMainKeyboard(isLinked),
    }
  );

  return result;
}

export async function sendTelegramTextToMany(users = [], text) {
  if (!botInstance) {
    throw new Error("Telegram bot is not started");
  }

  if (!text || !text.trim()) {
    throw new Error("Message text is required");
  }

  const results = [];

  for (const user of users) {
    const telegramUserId = user?.telegram_user_id;

    if (!telegramUserId) {
      results.push({
        success: false,
        telegramUserId: null,
        customerId: user?.id || null,
        error: "telegram_user_id is missing",
      });
      continue;
    }

    try {
      const safeName = String(user?.name || "").trim() || "друже";
      const finalText = text.replaceAll("{{name}}", safeName).trim();

      await botInstance.sendMessage(String(telegramUserId), finalText, {
        reply_markup: buildMainKeyboard(true),
      });

      results.push({
        success: true,
        telegramUserId: String(telegramUserId),
        customerId: user?.id || null,
      });
    } catch (error) {
      results.push({
        success: false,
        telegramUserId: String(telegramUserId),
        customerId: user?.id || null,
        error: error?.message || "Unknown error",
      });
    }
  }

  return results;
}
