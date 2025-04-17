import { Context } from 'grammy';
import { getUserProducts } from '../database/queries/product';

export async function productsCommand(ctx: Context) {
    const telegramId = ctx.from?.id;
    const lang = ctx.from?.language_code || 'ru';

    if (!telegramId) {
        return ctx.reply('Ошибка: не удалось определить пользователя.');
    }

    const products = await getUserProducts(telegramId, lang);

    if (!products || products.length === 0) {
        return ctx.reply('У вас пока нет добавленных продуктов. Добавьте их через /add или загрузите фото через /upload 🧊');
    }

    const list = products
        .map((entry, index) => `${index + 1}. ${entry.emoji} ${entry.name}`)
        .join('\n');

    return ctx.reply(`🧊 *Ваши продукты:*\n\n${list}`, {
        parse_mode: 'Markdown',
    });
}
