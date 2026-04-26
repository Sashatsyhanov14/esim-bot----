const { supabase } = require('./src/supabase');

const tariffs = [
  { sort_number: 1, country: 'Турция', data_gb: '1 Gb', validity_period: '7 дней', price_usd: 2.00 },
  { sort_number: 2, country: 'Турция', data_gb: '3 Gb', validity_period: '30 дней', price_usd: 4.00 },
  { sort_number: 3, country: 'Турция', data_gb: '5 Gb', validity_period: '30 дней', price_usd: 6.00 },
  { sort_number: 4, country: 'Турция', data_gb: '10 Gb', validity_period: '30 дней', price_usd: 9.00 },
  { sort_number: 5, country: 'Турция', data_gb: '20 Gb', validity_period: '30 дней', price_usd: 14.00 },
  { sort_number: 7, country: 'Турция', data_gb: 'Unlimited', validity_period: '30 дней', price_usd: 30.00 },

  { sort_number: 8, country: 'ЕС + ВБ', data_gb: '1 Gb', validity_period: '7 дней', price_usd: 3.00 },
  { sort_number: 9, country: 'ЕС + ВБ', data_gb: '3 Gb', validity_period: '30 дней', price_usd: 6.00 },
  { sort_number: 10, country: 'ЕС + ВБ', data_gb: '5 Gb', validity_period: '30 дней', price_usd: 8.00 },
  { sort_number: 11, country: 'ЕС + ВБ', data_gb: '10 Gb', validity_period: '30 дней', price_usd: 10.00 },
  { sort_number: 12, country: 'ЕС + ВБ', data_gb: '20 Gb', validity_period: '30 дней', price_usd: 15.00 },
  { sort_number: 14, country: 'ЕС + ВБ', data_gb: '2 Gb', validity_period: '15 дней', price_usd: 4.00 },

  { sort_number: 15, country: 'Китай', data_gb: '1 Gb', validity_period: '7 дней', price_usd: 2.00 },
  { sort_number: 16, country: 'Китай', data_gb: '3 Gb', validity_period: '30 дней', price_usd: 4.00 },
  { sort_number: 17, country: 'Китай', data_gb: '5 Gb', validity_period: '30 дней', price_usd: 6.00 },
  { sort_number: 18, country: 'Китай', data_gb: '10 Gb', validity_period: '30 дней', price_usd: 10.00 },
  { sort_number: 19, country: 'Китай', data_gb: '20 Gb', validity_period: '30 дней', price_usd: 20.00 },
  { sort_number: 20, country: 'Китай', data_gb: '50 Gb', validity_period: '30 дней', price_usd: 40.00 },

  { sort_number: 22, country: 'Саудия', data_gb: '1 Gb', validity_period: '7 дней', price_usd: 3.00 },
  { sort_number: 23, country: 'Саудия', data_gb: '3 Gb', validity_period: '30 дней', price_usd: 8.00 },
  { sort_number: 24, country: 'Саудия', data_gb: '5 Gb', validity_period: '30 дней', price_usd: 14.00 },
  { sort_number: 25, country: 'Саудия', data_gb: '10 Gb', validity_period: '30 дней', price_usd: 25.00 },
  { sort_number: 26, country: 'Саудия', data_gb: '20 Gb', validity_period: '30 дней', price_usd: 40.00 },
  { sort_number: 28, country: 'Саудия', data_gb: '2 Gb', validity_period: '30 дней', price_usd: 6.00 },

  { sort_number: 29, country: 'ОАЭ', data_gb: '1 Gb', validity_period: '7 дней', price_usd: 4.00 },
  { sort_number: 30, country: 'ОАЭ', data_gb: '3 Gb', validity_period: '30 дней', price_usd: 9.00 },
  { sort_number: 31, country: 'ОАЭ', data_gb: '5 Gb', validity_period: '30 дней', price_usd: 15.00 },
  { sort_number: 32, country: 'ОАЭ', data_gb: '10 Gb', validity_period: '30 дней', price_usd: 20.00 },
  { sort_number: 33, country: 'ОАЭ', data_gb: '20 Gb', validity_period: '30 дней', price_usd: 36.00 },
  { sort_number: 34, country: 'ОАЭ', data_gb: '50 Gb', validity_period: '30 дней', price_usd: 120.00 },

  { sort_number: 36, country: 'Россия', data_gb: '1 Gb', validity_period: '7 дней', price_usd: 3.00 },
  { sort_number: 37, country: 'Россия', data_gb: '3 Gb', validity_period: '30 дней', price_usd: 8.00 },
  { sort_number: 38, country: 'Россия', data_gb: '5 Gb', validity_period: '30 дней', price_usd: 12.00 },
  { sort_number: 39, country: 'Россия', data_gb: '10 Gb', validity_period: '30 дней', price_usd: 24.00 },
  { sort_number: 40, country: 'Россия', data_gb: '20 Gb', validity_period: '30 дней', price_usd: 45.00 },
  { sort_number: 41, country: 'Россия', data_gb: '50 Gb', validity_period: '30 дней', price_usd: 90.00 },

  { sort_number: 42, country: 'Ближний Восток', data_gb: '1 Gb', validity_period: '7 дней', price_usd: 5.00 },
  { sort_number: 43, country: 'Ближний Восток', data_gb: '3 Gb', validity_period: '30 дней', price_usd: 12.00 },
  { sort_number: 44, country: 'Ближний Восток', data_gb: '5 Gb', validity_period: '30 дней', price_usd: 20.00 },
  { sort_number: 45, country: 'Ближний Восток', data_gb: '10 Gb', validity_period: '30 дней', price_usd: 30.00 },
  { sort_number: 46, country: 'Ближний Восток', data_gb: '20 Gb', validity_period: '30 дней', price_usd: 100.00 },
  { sort_number: 47, country: 'Ближний Восток', data_gb: '2 Gb', validity_period: '30 дней', price_usd: 10.00 },

  { sort_number: 48, country: 'США', data_gb: '1 Gb', validity_period: '7 дней', price_usd: 2.00 },
  { sort_number: 49, country: 'США', data_gb: '3 Gb', validity_period: '30 дней', price_usd: 5.00 },
  { sort_number: 50, country: 'США', data_gb: '5 Gb', validity_period: '30 дней', price_usd: 8.00 },
  { sort_number: 51, country: 'США', data_gb: '10 Gb', validity_period: '30 дней', price_usd: 12.00 },
  { sort_number: 52, country: 'США', data_gb: '20 Gb', validity_period: '30 дней', price_usd: 20.00 },
  { sort_number: 53, country: 'США', data_gb: '50 Gb', validity_period: '30 дней', price_usd: 45.00 },

  { sort_number: 54, country: 'Азия', data_gb: '1 Gb', validity_period: '7 дней', price_usd: 2.00 },
  { sort_number: 55, country: 'Азия', data_gb: '3 Gb', validity_period: '30 дней', price_usd: 5.00 },
  { sort_number: 56, country: 'Азия', data_gb: '5 Gb', validity_period: '30 дней', price_usd: 7.00 },
  { sort_number: 57, country: 'Азия', data_gb: '10 Gb', validity_period: '30 дней', price_usd: 10.00 },
  { sort_number: 58, country: 'Азия', data_gb: '20 Gb', validity_period: '30 дней', price_usd: 18.00 },
  { sort_number: 59, country: 'Азия', data_gb: '50 Gb', validity_period: '30 дней', price_usd: 40.00 },

  { sort_number: 60, country: 'Корея', data_gb: '1 Gb', validity_period: '7 дней', price_usd: 2.00 },
  { sort_number: 61, country: 'Корея', data_gb: '3 Gb', validity_period: '30 дней', price_usd: 4.00 },
  { sort_number: 62, country: 'Корея', data_gb: '5 Gb', validity_period: '30 дней', price_usd: 5.00 },
  { sort_number: 63, country: 'Корея', data_gb: '10 Gb', validity_period: '30 дней', price_usd: 8.00 },
  { sort_number: 64, country: 'Корея', data_gb: '20 Gb', validity_period: '30 дней', price_usd: 15.00 },
  { sort_number: 65, country: 'Корея', data_gb: '50 Gb', validity_period: '30 дней', price_usd: 25.00 },
];

async function importTariffs() {
  console.log('=== Импорт тарифов ===');
  
  // 1. Удаляем старые тарифы
  console.log('Удаляем старые тарифы...');
  const { error: delError } = await supabase.from('tariffs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) console.warn('Ошибка удаления (может быть пустая таблица):', delError.message);
  else console.log('✅ Старые тарифы удалены');

  // 2. Вставляем новые
  console.log(`Вставляем ${tariffs.length} тарифов...`);
  const { data, error } = await supabase.from('tariffs').insert(tariffs).select();
  
  if (error) {
    console.error('❌ Ошибка вставки:', error.message);
    return;
  }
  
  console.log(`✅ Успешно добавлено ${data.length} тарифов!`);
  
  // 3. Проверка
  const { data: check } = await supabase.from('tariffs').select('country, data_gb, price_usd').order('sort_number');
  console.log('\n--- Проверка ---');
  const grouped = {};
  for (const t of check) {
    if (!grouped[t.country]) grouped[t.country] = [];
    grouped[t.country].push(`${t.data_gb} = $${t.price_usd}`);
  }
  for (const [country, plans] of Object.entries(grouped)) {
    console.log(`${country}: ${plans.join(' | ')}`);
  }
  console.log(`\nИтого: ${check.length} тарифов в базе`);
}

importTariffs().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
