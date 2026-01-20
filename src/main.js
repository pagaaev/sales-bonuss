/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции

   // Достаём данные из покупки
   const { discount, sale_price, quantity} = purchase;

   // Переведём скидку в число
   const discountRate = discount / 100;

   // Считаем полную стоимость без скидки
   const totalPrice = sale_price * quantity;

   // Применяем скидку
   const revenue = totalPrice * (1 - discountRate);

   // Возвращаем доход
   return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге

    // Достаём прибыль из продавца
    const { profit } = seller;

    // Процент бонуса
    let bonusPercent = 0;

    // Если продавец первый
    if (index === 0) {
        bonusPercent = 15;
    }

    // Если второй или третий
    else if (index === 1 || index === 2) {
        bonusPercent = 10;
    }

    // Если последний
    else if (index === total - 1) {
        bonusPercent = 0;
    }

    // Все остальные
    else {
        bonusPercent = 5;
    }

    // Считаем бонус
    const bonus = profit * bonusPercent / 100;

    // Возвращаем бонус
    return bonus;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (
        !data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций

    // Проверка массива options
    if (!options || typeof options !== 'object') {
        throw new Error('Опции не переданы или имеют неверный формат')
    }

    const { calculateRevenue, calculateBonus } = options;

    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Не переданы функции для расчётов');
    }

    // Статистика по каждому продавцу
    const sellerStats = data.sellers.map((seller) => ({
        id: seller.id, // Уникальный идентификатор продавца
        name: `${seller.first_name} ${seller.last_name}`, // Имя и фамиия продавца
        revenue: 0, // Доход (деньги с продаж)
        profit: 0, // Прибыль (выручка-себестоимость)
        sales_count: 0, // Счётчик(сколько продаж сделал продавец)
        products_sold: {} // Копилка(объект)
    }));

    const productBySku = Object.fromEntries(
        data.products.map(p => [p.sku, p])
    );

    const sellerById = Object.fromEntries(
        sellerStats.map(stat => [stat.id, stat])
    );

    data.purchase_records.forEach(record => {
        
        // Получаем объем статистики продавцов по id
        const seller = sellerById[record.seller_id];

        // Увеличиваем кол-во продаж
        seller.sales_count += 1;

        // Увеличиваем общую выручку на сумму чека
        seller.revenue += record.total_amount;

        record.items.forEach(item => {

            // Получаем товар по SKU
            const product = productBySku[item.sku];

            if (!product) {
                console.log(`Товар с SKU ${item.sku} не найден в каталоге`);
                return;
            }

            // Себестоимост ьтовара
            const cost = product.purchase_price * item.quantity;

            // Выручка с учётом скидки 
            const revenue = calculateRevenue(item, product);

            // Прибыль = выручка - себестоимость
            const profit = revenue - cost;

            // Увеличиваем накопленную прибыль продавца
            seller.profit += profit;

            // Учёт кол-ва проданных товара
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }

            seller.products_sold[item.sku] += item.quantity;

        });

    });

    // Сортировка
    sellerStats.sort((a, b) => b.profit - a.profit);

    // Бонусы и топ-10 товаров
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);

        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));

    // @TODO: Подготовка промежуточных данных для сбора статистики

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    // @TODO: Расчет выручки и прибыли для каждого продавца

    // @TODO: Сортировка продавцов по прибыли

    // @TODO: Назначение премий на основе ранжирования

    // @TODO: Подготовка итоговой коллекции с нужными полями
}