import prisma from '../client';

type UserProductWithTranslation = {
    product: {
        id: string;
        translations: {
            language: string;
            name: string;
            emoji: string | null;
        }[];
    };
    createdAt: Date;
};

export async function getUserProducts(telegramId: number, language = 'en') {
    const user = await prisma.user.findUnique({
        where: { telegramId },
        select: { id: true },
    });

    if (!user) return [];

    const products = await prisma.userProduct.findMany({
        where: { userId: user.id },
        include: {
            product: {
                include: {
                    translations: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    }) as unknown as UserProductWithTranslation[];

    return products.map((entry) => {
        const tr = entry.product.translations.find((t) => t.language === language);
        return {
            id: entry.product.id,
            name: tr?.name || entry.product.id,
            emoji: tr?.emoji || '',
            createdAt: entry.createdAt,
        };
    });
}

export async function addProductToUser(telegramId: number, productId: string) {
    const user = await prisma.user.findUnique({
        where: { telegramId },
        select: { id: true },
    });

    if (!user) throw new Error('User not found');

    const product = await prisma.product.findUnique({
        where: { id: productId.toLowerCase() },
    });

    if (!product) return { success: false, reason: 'not_found' };

    try {
        await prisma.userProduct.create({
            data: {
                userId: user.id,
                productId: product.id,
            },
        });

        return { success: true };
    } catch (err) {
        if (
            err instanceof Error &&
            'code' in err &&
            (err as any).code === 'P2002'
        ) {
            return { success: false, reason: 'already_exists' };
        }

        throw err;
    }
}

export async function removeProductFromUser(telegramId: number, productId: string) {
    const user = await prisma.user.findUnique({
        where: { telegramId },
        select: { id: true },
    });

    if (!user) throw new Error('User not found');

    const product = await prisma.product.findUnique({
        where: { id: productId.toLowerCase() },
    });

    if (!product) return { success: false, reason: 'not_found' };

    const entry = await prisma.userProduct.findUnique({
        where: {
            userId_productId: {
                userId: user.id,
                productId: product.id,
            },
        },
    });

    if (!entry) return { success: false, reason: 'not_in_list' };

    await prisma.userProduct.delete({
        where: { id: entry.id },
    });

    return { success: true };
}

/**
 * Удаляет все продукты пользователя.
 */
export async function clearUserProducts(telegramId: number): Promise<number> {
    // Найти внутренний userId
    const user = await prisma.user.findUnique({
        where: { telegramId },
        select: { id: true },
    });
    if (!user) return 0;

    // Удалить все UserProduct для этого userId
    const result = await prisma.userProduct.deleteMany({
        where: { userId: user.id },
    });

    // result.count — число удалённых записей
    return result.count;
}

/**
 * Возвращает список productId, которые уже есть у данного telegramId.
 */
export async function getUserProductIds(
    telegramId: number
): Promise<string[]> {
    const user = await prisma.user.findUnique({
        where: { telegramId },
        select: { id: true },
    });
    if (!user) return [];
    const ups = await prisma.userProduct.findMany({
        where: { userId: user.id },
        select: { productId: true },
    });
    return ups.map((u) => u.productId);
}