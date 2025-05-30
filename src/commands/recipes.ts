// src/commands/recipes.ts

import { MyContext } from '../types'
import { InlineKeyboard } from 'grammy'
import { getRecipeRecommendations } from '../database/queries/recipe'
import { RECIPE_PAGE_SIZE } from '../config'
import { cleanupNav, renderNav } from '../utils/pagination'
import { t } from '../i18n'

/**
 * /recipes — загрузка и показ первой страницы
 */
export async function recipesCommand(ctx: MyContext) {
    const telegramId = ctx.from!.id
    const lang = ctx.from!.language_code || 'en'
    const recs = await getRecipeRecommendations(telegramId, 1000, lang)
    if (!recs.length) {
        return ctx.reply(t(ctx, 'recipes.noResults'))
    }

    ctx.session.recs = recs
    ctx.session.recipePage = 0
    ctx.session.lastRecipeMessageIds = []
    await cleanupNav(ctx, 'lastRecipesNavMessageId')
    return renderRecipePage(ctx)
}

/**
 * Обработчик callback для страниц /recipes
 */
export async function recipesPageHandler(ctx: MyContext) {
    const data = ctx.callbackQuery?.data
    if (!data) return
    const [, , pageStr] = data.split('_') // recipes_page_<n>
    ctx.session.recipePage = parseInt(pageStr, 10)
    await ctx.answerCallbackQuery()
    await cleanupRecipePage(ctx)
    return renderRecipePage(ctx)
}

/** Рендер страницы рецептов */
async function renderRecipePage(ctx: MyContext) {
    const recs = ctx.session.recs!
    const page = ctx.session.recipePage!
    const start = page * RECIPE_PAGE_SIZE
    const slice = recs.slice(start, start + RECIPE_PAGE_SIZE)

    ctx.session.lastRecipeMessageIds = []
    for (let i = 0; i < slice.length; i++) {
        const r = slice[i]
        const num = start + i + 1
        const parts = [
            `*${num}. ${r.title}*`,
            `${t(ctx, 'recipe.ingredients')}: ${r.matchedCount}/${r.totalIngredients}`,
            r.description || '',
        ].filter(Boolean)
        const text = parts.join('\n\n')

        const kb = new InlineKeyboard()
            .text(t(ctx, 'recipes.showRecipe'), `show_${r.id}`)
            .text(t(ctx, 'recipes.saveRecipe'), `save_${r.id}`)

        const sent = await ctx.reply(text, {
            parse_mode: 'Markdown',
            reply_markup: kb,
        })
        ctx.session.lastRecipeMessageIds!.push({
            chat: sent.chat.id,
            message_id: sent.message_id,
        })
    }

    await renderNav(
        ctx,
        'recipes_page',
        page,
        recs.length,
        RECIPE_PAGE_SIZE,
        'lastRecipesNavMessageId'
    )
}

/** Удаление предыдущей страницы */
async function cleanupRecipePage(ctx: MyContext) {
    const msgs = ctx.session.lastRecipeMessageIds || []
    for (const m of msgs) {
        try { await ctx.api.deleteMessage(m.chat, m.message_id) } catch {}
    }
    delete ctx.session.lastRecipeMessageIds
    await cleanupNav(ctx, 'lastRecipesNavMessageId')
}
