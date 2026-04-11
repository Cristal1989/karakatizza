import TelegramBot from "node-telegram-bot-api";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL =
  process.env.TELEGRAM_CRM_API_URL ||
  "https://karakatizza-production.up.railway.app";
const TELEGRAM_SUPPORT_URL = "https://t.me/karakatizza_sushi";
const TELEGRAM_SUPPORT_USERNAME = "@karakatizza_sushi";

let botInstance = null;

const pendingPhones = new Map();
const pendingReturnUrls = new Map();
const pendingReturnDrafts = new Map();

function normalizePhone(phone = "") {
  const digits = String(phone).replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("380")) return `+${digits}`;
  if (digits.startsWith("80")) return `+3${digits}`;
  if (digits.startsWith("0")) return `+38${digits}`;

  return phone.startsWith("+") ? phone : `+${digits}`;
}

function buildMainKeyboard(isPhoneConfirmed = false) {
  const firstRow = isPhoneConfirmed
    ? [{ text: "Мій бонус" }, { text: "Акції" }]
    : [{ text: "Підтвердити номер", request_contact: true }];

  return {
    keyboard: [firstRow, [{ text: "Написати нам" }, { text: "Допомога" }]],
    resize_keyboard: true,
    persistent: true,
  };
}

function getDraftTokenFromStartParam(startParam = "") {
  if (!startParam.startsWith("checkout_")) return "";
  return startParam.replace(/^checkout_/, "").trim();
}

function buildCheckoutReturnUrl(draftToken = "") {
  const baseUrl = "https://karakatizza.vercel.app/checkout";

  if (!draftToken) {
    return `${baseUrl}?tg=1`;
  }

  return `${baseUrl}?draft=${encodeURIComponent(draftToken)}&tg=1`;
}

async function getCustomerByTelegramUserId(telegramUserId) {
  if (!telegramUserId) return null;

  const response = await fetch(
    `${API_BASE_URL}/api/crm/telegram/customer/${telegramUserId}`
  );


  const rawText = await response.text();

  if (!response.ok) {
    return null;
  }

  const data = rawText ? JSON.parse(rawText) : null;

  return data?.customer || null;
}

async function tryLinkTelegramByPhone({
  phone,
  telegramUserId,
  telegramUsername = "",
  telegramFirstName = "",
}) {
  try {
    console.log("BOT TRY LINK START", {
      phone,
      telegramUserId,
      telegramUsername,
      telegramFirstName,
    });

    const result = await postJson(`${API_BASE_URL}/api/crm/telegram/link`, {
      phone,
      telegramUserId,
      telegramUsername,
      telegramFirstName,
    });

    console.log("BOT TRY LINK RAW RESULT", result);

    if (result?.reason === "pending_until_first_order") {
      const normalized = {
        success: true,
        linked: false,
        reason: "pending_until_first_order",
        customer: null,
        pendingLink: result.pendingLink || null,
      };

      console.log("BOT TRY LINK NORMALIZED RESULT", normalized);
      return normalized;
    }

    if (result?.linked === true && result?.customer) {
      const normalized = {
        success: true,
        linked: true,
        reason: "linked",
        customer: result.customer,
        pendingLink: null,
      };

      console.log("BOT TRY LINK NORMALIZED RESULT", normalized);
      return normalized;
    }

    const normalized = {
      success: false,
      linked: false,
      reason: result?.reason || "link_failed",
      customer: result?.customer || null,
      pendingLink: result?.pendingLink || null,
    };

    console.log("BOT TRY LINK NORMALIZED RESULT", normalized);
    return normalized;
  } catch (error) {
    console.error("BOT TRY LINK ERROR", {
      message: error?.message || error,
      stack: error?.stack || null,
    });

    return {
      success: false,
      linked: false,
      reason: error?.message || "link_failed",
      customer: null,
      pendingLink: null,
    };
  }
}

async function postJson(url, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();

    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Сервер повернув не JSON: ${text.slice(0, 300)}`);
    }

    if (!response.ok) {
      throw new Error(data?.message || "HTTP request failed");
    }

    return data;
  } catch (error) {
    console.error("BOT POST JSON ERROR", {
      url,
      body,
      message: error?.message || error,
      name: error?.name || null,
    });

    if (error?.name === "AbortError") {
      throw new Error("CRM API не відповів за 15 секунд");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
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

async function getTelegramPromoSettings() {
  const data = await getJson(`${API_BASE_URL}/site-settings`);

  return {
    title: data?.telegramPromo?.title || "🔥 Актуальні акції Karakatizza",
    text:
      data?.telegramPromo?.text ||
      "Слідкуй за нашими пропозиціями на сайті та в Telegram.",
  };
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

async function handleContactUs(bot, msg) {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    `Потрібна допомога, хочеш уточнити замовлення або є питання по меню?\n\nНапиши нам у Telegram: ${TELEGRAM_SUPPORT_USERNAME}`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Написати нам",
              url: TELEGRAM_SUPPORT_URL,
            },
          ],
        ],
      },
    }
  );
}

async function handlePromotions(bot, msg) {
  try {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id ? String(msg.from.id) : "";

    const customer = await getCustomerByTelegramUserId(telegramUserId);
    const isLinked = Boolean(customer?.telegram_user_id);

    const promo = await getTelegramPromoSettings();

    const title = (promo.title || "").trim();
    const text = (promo.text || "").trim();

    const message = [title, text].filter(Boolean).join("\n\n");

    await bot.sendMessage(chatId, message || "Зараз активних акцій немає.", {
      reply_markup: buildMainKeyboard(isLinked),
    });
  } catch (error) {
    console.error("TELEGRAM PROMOTIONS ERROR:", error);

    const telegramUserId = msg.from?.id ? String(msg.from.id) : "";
    const customer = await getCustomerByTelegramUserId(telegramUserId).catch(
      () => null
    );
    const isLinked = Boolean(customer?.telegram_user_id);

    await bot.sendMessage(
      msg.chat.id,
      "Не вдалося завантажити актуальні акції. Спробуй ще раз трохи пізніше.",
      {
        reply_markup: buildMainKeyboard(isLinked),
      }
    );
  }
}

async function handleMyBonus(bot, msg) {
  const chatId = msg.chat.id;
  const telegramUserId = msg.from?.id ? String(msg.from.id) : "";
  const telegramUsername = msg.from?.username || "";
  const telegramFirstName = msg.from?.first_name || "";

  try {
    let customer = await getCustomerByTelegramUserId(telegramUserId);
    let isLinked = Boolean(customer?.telegram_user_id);

    if (!customer) {
      const pendingPhone = pendingPhones.get(telegramUserId);

      if (pendingPhone) {
        try {
          const linkResult = await tryLinkTelegramByPhone({
            phone: pendingPhone,
            telegramUserId,
            telegramUsername,
            telegramFirstName,
          });

          console.log("BOT MY BONUS LINK RESULT", {
            pendingPhone,
            telegramUserId,
            linkResult,
          });

          if (linkResult?.reason === "pending_until_first_order") {
            console.log("BOT MY BONUS PENDING FLOW", {
              pendingPhone,
              telegramUserId,
              reason: linkResult?.reason,
              pendingLink: linkResult?.pendingLink || null,
            });

            await bot.sendMessage(
              chatId,
              "Номер підтверджено ✅\n\nTelegram буде автоматично прив'язаний після першого замовлення.\n🎁 Бонус за підписку буде нараховано після першого замовлення та стане доступним на наступному.",
              {
                reply_markup: buildMainKeyboard(false),
              }
            );
            return;
          }

          if (linkResult?.success && linkResult?.customer) {
            customer = linkResult.customer;
            isLinked = Boolean(customer?.telegram_user_id);
            pendingPhones.delete(telegramUserId);
          }
        } catch (linkError) {
          if (linkError?.message !== "Клієнта з таким номером не знайдено") {
            console.error(
              "TELEGRAM RE-LINK FROM PENDING PHONE ERROR:",
              linkError
            );
          }
        }
      }
    }

    if (!customer) {
      await bot.sendMessage(
        chatId,
        `Я ще не бачу прив'язаний номер телефону 🙁

Натисни "Підтвердити номер", щоб я зміг знайти твій профіль і перевірити бонус.

Якщо ти вже підтверджував номер, але оформив перше замовлення тільки після цього — просто натисни "Підтвердити номер" ще раз.`,
        {
          reply_markup: buildMainKeyboard(false),
        }
      );
      return;
    }

    const bonusSettings = await getJson(`${API_BASE_URL}/gift-roll/settings`);
    const activeGiftResponse = await getJson(
      `${API_BASE_URL}/api/crm/telegram-gifts/active/${encodeURIComponent(
        customer.phone
      )}`
    );

    const activeGift = activeGiftResponse?.gift || null;

    const bonusType = bonusSettings?.bonusType || "gift_product";
    const bonusTitle = bonusSettings?.bonusTitle || "";
    const bonusDescription = bonusSettings?.bonusDescription || "";
    const bonusImage = bonusSettings?.bonusImage || "";
    const discountPercent = bonusSettings?.discountPercent || "";
    const customText = bonusSettings?.customText || "";

    if (activeGift && activeGift.status === "issued") {
      if (bonusType === "gift_product") {
        const title = bonusTitle || activeGift.gift_roll_title || "Подарунок";
        const description =
          bonusDescription || "Бонус уже закріплений за твоїм номером.";
        const image = bonusImage || "";

        const text = `🎁 Твій бонус

Подарунок: ${title}

${description}

Він уже закріплений за твоїм номером і буде використаний при наступному замовленні.`;

        if (image) {
          try {
            await bot.sendPhoto(chatId, image, {
              caption: text,
              reply_markup: buildMainKeyboard(isLinked),
            });
            return;
          } catch (photoError) {
            console.error("TELEGRAM BONUS PHOTO ERROR:", photoError);
          }
        }

        await bot.sendMessage(chatId, text, {
          reply_markup: buildMainKeyboard(isLinked),
        });
        return;
      }

      if (bonusType === "discount_percent") {
        const text = `🎁 У тебе є активний бонус

Знижка: ${discountPercent || "0"}% на наступне замовлення

Бонус уже закріплений за твоїм номером і буде використаний при наступному замовленні.`;

        await bot.sendMessage(chatId, text, {
          reply_markup: buildMainKeyboard(isLinked),
        });
        return;
      }

      if (bonusType === "custom_text") {
        const text = `🎁 У тебе є активний бонус

${customText || "Для тебе діє спеціальна пропозиція."}

Бонус уже закріплений за твоїм номером і буде використаний при наступному замовленні.`;

        await bot.sendMessage(chatId, text, {
          reply_markup: buildMainKeyboard(isLinked),
        });
        return;
      }
    }

    let usedGift = null;

    try {
      const usedGiftResponse = await getJson(
        `${API_BASE_URL}/api/crm/telegram-gifts/history/${encodeURIComponent(
          customer.phone
        )}`
      );

      const giftsHistory = Array.isArray(usedGiftResponse?.gifts)
        ? usedGiftResponse.gifts
        : [];

      usedGift = giftsHistory.find((item) => item.status === "used") || null;
    } catch (historyError) {
      console.log(
        "TELEGRAM BONUS HISTORY SKIPPED:",
        historyError?.message || historyError
      );
    }

    if (usedGift) {
      if (bonusType === "gift_product") {
        const title = bonusTitle || usedGift.gift_roll_title || "Подарунок";
        const image = bonusImage || "";

        const text = `✅ Бонус уже був використаний

Подарунок: ${title}

Якщо з'являться нові акції — я напишу тобі тут у Telegram.`;

        if (image) {
          try {
            await bot.sendPhoto(chatId, image, {
              caption: text,
              reply_markup: buildMainKeyboard(isLinked),
            });
            return;
          } catch (photoError) {
            console.error("TELEGRAM USED BONUS PHOTO ERROR:", photoError);
          }
        }

        await bot.sendMessage(chatId, text, {
          reply_markup: buildMainKeyboard(isLinked),
        });
        return;
      }

      if (bonusType === "discount_percent") {
        const text = `✅ Бонус уже був використаний

Знижка: ${discountPercent || "0"}%

Якщо з'являться нові акції — я напишу тобі тут у Telegram.`;

        await bot.sendMessage(chatId, text, {
          reply_markup: buildMainKeyboard(isLinked),
        });
        return;
      }

      if (bonusType === "custom_text") {
        const text = `✅ Бонус уже був використаний

${customText || "Спеціальна пропозиція вже була використана."}

Якщо з'являться нові акції — я напишу тобі тут у Telegram.`;

        await bot.sendMessage(chatId, text, {
          reply_markup: buildMainKeyboard(isLinked),
        });
        return;
      }
    }

    await bot.sendMessage(
      chatId,
      `Зараз у тебе немає активного бонусу.

Якщо з'являться нові акції — я напишу тобі тут у Telegram.`,
      {
        reply_markup: buildMainKeyboard(isLinked),
      }
    );
  } catch (error) {
    console.error("TELEGRAM MY BONUS ERROR:", error);

    let isLinked = false;
    try {
      const customer = await getCustomerByTelegramUserId(telegramUserId);
      isLinked = Boolean(customer?.telegram_user_id);
    } catch {}

    await bot.sendMessage(
      chatId,
      "Не вдалося перевірити бонус. Спробуй ще раз трохи пізніше.",
      {
        reply_markup: buildMainKeyboard(isLinked),
      }
    );
  }
}

function buildReturnInlineKeyboard(returnUrl) {
  if (!returnUrl) return undefined;

  return {
    inline_keyboard: [
      [
        {
          text: "Повернутися до оформлення",
          url: returnUrl,
        },
      ],
    ],
  };
}

async function handleContact(bot, msg) {
  if (!bot || !msg || !msg.chat) {
    console.error("TELEGRAM CONTACT FLOW ERROR: invalid message payload", {
      hasBot: Boolean(bot),
      hasMsg: Boolean(msg),
      msgKeys: msg ? Object.keys(msg) : [],
    });
    return;
  }

  const chatId = msg.chat.id;
  const telegramUserId = String(msg.from?.id || "");
  const telegramUsername = msg.from?.username || "";
  const telegramFirstName = msg.from?.first_name || "";
  const contact = msg.contact || null;

  const draftToken = pendingReturnDrafts.get(telegramUserId) || "";
  const returnUrl = buildCheckoutReturnUrl(draftToken);

  if (!contact?.phone_number) {
    await bot.sendMessage(
      chatId,
      'Не вдалося отримати номер телефону. Спробуй ще раз через кнопку "Підтвердити номер".',
      {
        reply_markup: draftToken
          ? buildReturnInlineKeyboard(returnUrl)
          : buildMainKeyboard(false),
      }
    );
    return;
  }

  if (String(contact.user_id || "") !== telegramUserId) {
    await bot.sendMessage(
      chatId,
      "Будь ласка, надішли саме свій номер через кнопку Telegram, а не чужий контакт.",
      {
        reply_markup: draftToken
          ? buildReturnInlineKeyboard(returnUrl)
          : buildMainKeyboard(false),
      }
    );
    return;
  }

  const normalizedPhone = normalizePhone(contact.phone_number);
  pendingPhones.set(telegramUserId, normalizedPhone);

  try {
    const linkResult = await tryLinkTelegramByPhone({
      phone: normalizedPhone,
      telegramUserId,
      telegramUsername,
      telegramFirstName,
    });

    console.log("BOT HANDLE CONTACT LINK RESULT", {
      phone: normalizedPhone,
      telegramUserId,
      linkResult,
    });
    
    if (linkResult?.reason === "pending_until_first_order") {
      pendingPhones.delete(telegramUserId);

      console.log("BOT HANDLE CONTACT PENDING FLOW", {
        phone: normalizedPhone,
        telegramUserId,
        reason: linkResult?.reason,
        pendingLink: linkResult?.pendingLink || null,
      });
    
      await bot.sendMessage(
        chatId,
        "Готово ✅\n\nНомер підтверджено.\nTelegram буде автоматично прив'язаний після першого замовлення.\n\n🎁 Бонус за підписку буде нараховано після першого замовлення та стане доступним на наступному.",
        {
          reply_markup: buildReturnInlineKeyboard(returnUrl),
        }
      );
    
      await bot.sendMessage(chatId, "Що далі?", {
        reply_markup: buildMainKeyboard(true),
      });
    
      pendingReturnDrafts.delete(telegramUserId);
      return;
    }
    
    if (!linkResult?.success) {
      await bot.sendMessage(
        chatId,
        "Не вдалося прив'язати Telegram до клієнта. Спробуй пізніше.",
        {
          reply_markup: draftToken
            ? buildReturnInlineKeyboard(returnUrl)
            : buildMainKeyboard(false),
        }
      );
      return;
    }
    
    if (!linkResult?.customer) {
      await bot.sendMessage(
        chatId,
        "Не вдалося прив'язати Telegram до клієнта. Спробуй пізніше.",
        {
          reply_markup: draftToken
            ? buildReturnInlineKeyboard(returnUrl)
            : buildMainKeyboard(false),
        }
      );
      return;
    }
    
    const customer = linkResult.customer;
    pendingPhones.delete(telegramUserId);

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
          reply_markup: buildReturnInlineKeyboard(returnUrl),
        }
      );
    
      await bot.sendMessage(chatId, "Що далі?", {
        reply_markup: buildMainKeyboard(true),
      });
    
      pendingReturnDrafts.delete(telegramUserId);
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
    
    🎁 Бонус за підписку вже був нарахований раніше.`,
        {
          reply_markup: buildReturnInlineKeyboard(returnUrl),
        }
      );
    
      await bot.sendMessage(chatId, "Що далі?", {
        reply_markup: buildMainKeyboard(true),
      });
    
      pendingReturnDrafts.delete(telegramUserId);
      return;
    }
    
    await bot.sendMessage(
      chatId,
      `Номер підтверджено ✅
    
    Telegram прив'язаний до твого профілю.`,
      {
        reply_markup: buildReturnInlineKeyboard(returnUrl),
      }
    );
    
    await bot.sendMessage(chatId, "Що далі?", {
      reply_markup: buildMainKeyboard(true),
    });
    
    pendingReturnDrafts.delete(telegramUserId);
    return;
  } catch (error) {
    console.error("TELEGRAM CONTACT FLOW ERROR:", error);

    const messageText =
      error?.message === "Клієнта з таким номером не знайдено"
        ? `Я поки не знайшов замовлень з цим номером у базі 😕
Перевір, чи саме цей номер ти вказував при оформленні замовлення.

Якщо ти оформиш перше замовлення пізніше — просто натисни "Мій бонус" або ще раз відкрий бота.`
        : "Сталася помилка під час підтвердження номера. Спробуй трохи пізніше.";

    await bot.sendMessage(chatId, messageText, {
      reply_markup: draftToken
        ? buildReturnInlineKeyboard(returnUrl)
        : buildMainKeyboard(false),
    });

    return;
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

  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    try {
      const chatId = msg.chat.id;
      const telegramUserId = msg.from?.id ? String(msg.from.id) : "";
      const firstName = msg.from?.first_name || "друже";
  
      const startParam = match?.[1] || "";
      const draftToken = getDraftTokenFromStartParam(startParam);
  
      if (telegramUserId && draftToken) {
        pendingReturnDrafts.set(telegramUserId, draftToken);
      }
  
      const customer = await getCustomerByTelegramUserId(telegramUserId);
      const isLinked = Boolean(customer?.telegram_user_id);
  
      if (isLinked) {
        const returnUrl = buildCheckoutReturnUrl(draftToken);
  
        if (draftToken) {
          await bot.sendMessage(
            chatId,
            `Привіт, ${firstName}! 👋
  
  Telegram уже прив'язаний до твого профілю в Karakatizza.
  
  Повернутися до оформлення замовлення:`,
            {
              reply_markup: buildReturnInlineKeyboard(returnUrl),
            }
          );
  
          pendingReturnDrafts.delete(telegramUserId);
          return;
        }
  
        await bot.sendMessage(
          chatId,
          `Привіт, ${firstName}! 👋
  
  Telegram уже прив'язаний до твого профілю в Karakatizza.`,
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

    if (text === "Написати нам") {
      await handleContactUs(bot, msg);
      return;
    }

    if (text === "Мій бонус") {
      await handleMyBonus(bot, msg);
      return;
    }

    if (text === "Акції") {
      await handlePromotions(bot, msg);
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
