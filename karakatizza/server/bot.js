import TelegramBot from "node-telegram-bot-api";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = process.env.TELEGRAM_CRM_API_URL || "http://localhost:5000";

let botInstance = null;

function buildMainKeyboard() {
  return {
    keyboard: [
      [
        {
          text: "Підтвердити номер",
          request_contact: true,
        },
      ],
      [{ text: "Мій бонус" }],
      [{ text: "Допомога" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
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

async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || "друже";

  await bot.sendMessage(
    chatId,
    `Привіт, ${firstName}! 👋

Підтверди свій номер телефону, який ти вказував у замовленні в Karakatizza, і ми закріпимо за тобою Telegram-профіль.

🎁 За перше підтвердження номера — одноразовий бонус до наступного замовлення.

Натисни кнопку нижче:`,
    {
      reply_markup: buildMainKeyboard(),
    }
  );
}

async function handleHelp(bot, msg) {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    `Що тут можна зробити:

1. Підтвердити номер телефону
2. Отримати одноразовий бонус за Telegram
3. У майбутньому — отримувати акції та персональні повідомлення

Щоб почати, натисни кнопку "Підтвердити номер".`,
    {
      reply_markup: buildMainKeyboard(),
    }
  );
}

async function handleMyBonus(bot, msg) {
  const chatId = msg.chat.id;
  const telegramUserId = String(msg.from?.id || "");

  try {
    const result = await getJson(
      `${API_BASE_URL}/api/crm/telegram/bonus/${telegramUserId}`
    );

    if (!result?.customer) {
      await bot.sendMessage(
        chatId,
        `Я ще не бачу прив'язаний номер телефону 😕

Натисни "Підтвердити номер", щоб я зміг знайти твій профіль і перевірити бонус.`,
        {
          reply_markup: buildMainKeyboard(),
        }
      );
      return;
    }

    if (result.activeGift) {
      const giftTitle =
        result.activeGift.gift_roll_title || "подарунок до наступного замовлення";

      await bot.sendMessage(
        chatId,
        `🎁 У тебе є активний бонус

Подарунок: ${giftTitle}
Статус: активний

Він уже закріплений за твоїм номером і буде використаний при наступному замовленні.`,
        {
          reply_markup: buildMainKeyboard(),
        }
      );
      return;
    }

    if (result.usedGift) {
      const giftTitle =
        result.usedGift.gift_roll_title || "подарунок за підписку";

      await bot.sendMessage(
        chatId,
        `✅ Бонус уже був використаний

Подарунок: ${giftTitle}

Якщо з'являться нові акції — я напишу тобі тут у Telegram.`,
        {
          reply_markup: buildMainKeyboard(),
        }
      );
      return;
    }

    await bot.sendMessage(
      chatId,
      `Поки що активного бонусу не знайдено.

Якщо ти щойно підтвердив номер, спробуй перевірити ще раз через кілька секунд.`,
      {
        reply_markup: buildMainKeyboard(),
      }
    );
  } catch (error) {
    console.error("TELEGRAM MY BONUS ERROR:", error);

    await bot.sendMessage(
      chatId,
      "Не вдалося перевірити бонус. Спробуй ще раз трохи пізніше.",
      {
        reply_markup: buildMainKeyboard(),
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
      "Не вдалося отримати номер телефону. Спробуй ще раз через кнопку \"Підтвердити номер\".",
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
      issueResult = await postJson(`${API_BASE_URL}/api/crm/telegram-gifts/issue`, {
        customerId: customer.id,
        phone: customer.phone,
        giftRollId: "telegram-welcome",
        giftRollTitle: "Подарунковий рол",
        comment: "Telegram welcome gift",
      });
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
          reply_markup: buildMainKeyboard(),
        }
      );
      return;
    }

    if (issueResult?.created === false && issueResult?.reason === "active_gift_exists") {
      await bot.sendMessage(
        chatId,
        `Номер підтверджено ✅

Telegram уже прив'язаний до твого профілю.
🎁 Бонус за підписку вже був нарахований раніше і закріплений за твоїм номером.`,
        {
          reply_markup: buildMainKeyboard(),
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

  bot.onText(/^\/start$/, async (msg) => {
    await handleStart(bot, msg);
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