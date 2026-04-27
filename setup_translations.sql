-- 1. Создание таблицы для переводов (forTranslate)
CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  name_lt TEXT NOT NULL,
  name_ru TEXT,
  name_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Очистка таблицы перед вставкой (опционально, если хотите начать с чистого листа)
-- TRUNCATE TABLE translations RESTART IDENTITY;

-- 3. Вставка всех текущих данных из списка forTranslate
INSERT INTO translations (name_lt, name_ru, name_en)
VALUES 
('Virtų burokėlių salotos su pupel.ir raug.agurk.', 'Салат из вареных свеклы с фасолью и маринованными огурцами', 'Boiled beetroot salad with beans and pickles'),
('Pomidorų -agurkų salotos su grietine', 'Салат из помидоров и огурцов со сметаной', 'Tomato and cucumber salad with sour cream'),
('Silkė su daržovėmis', 'Сельдь с овощами', 'Herring with vegetables'),
('Jogurtinis padažas', 'Йогуртовый соус', 'Yogurt sauce'),
('Keptas su garais brokolių ir kiaušinių apkeptas', 'Запеченные броколи с яйцом', 'Steamed broccoli and egg bake'),
('Morkų ir obuolių salotos su nesal.jogurtu', 'Салат из моркови и яблок с несладким йогуртом', 'Carrot and apple salad with unsweetened yogurt'),
('Salotos „Versmė“ (su kumpiu)', 'Салат „Версме“ с ветчиной', 'Versme salad (with ham)'),
('Karališkiejį balandėliai su padažu', 'Королевские голубцы с соусом', 'Royal cabbage rolls with sauce'),
('Kiaulienos sprandinė su džiov.slyvomis', 'Свиная шейка с сушеными сливами', 'Pork neck with prunes'),
('Karališkas silkės salotos', 'Королевский салат с сельдью', 'Royal herring salad'),
('Kepti su garais kalakut. krūtin. kukulaičiai', 'Паровые тефтели из грудки индейки', 'Steamed turkey breast meatballs'),
('Perlinės košė su sviestu', 'Перловая каша с маслом', 'Pearl barley porridge with butter'),
('Perlinė košė su sviestu', 'Перловая каша с маслом', 'Pearl barley porridge with butter'),
('Salotos „Mįslė“', 'Салат „Загадка“', 'Misle salad'),
('Kukurūзų salotos', 'Кукурузный салат', 'Corn salad'),
('Silkė su marinatu', 'Сельдь с маринадом', 'Herring in marinade'),
('Kiaulienos guliašas', 'Свиной гуляш', 'Pork goulash'),
('Virta kiaulienos nugarine', 'Отварная свиная корейка', 'Boiled pork loin'),
('Virta kiaulienos nugarinė', 'Отварная свиная корейка', 'Boiled pork loin'),
('Vištienos suktinukai Vaidilutė', 'Куриные рулетики „Вайдилуте“', 'Chicken rolls Vaidilute'),
('Kalakutų šlaunelių mėsos troškinys(mork.paprik)', 'Тушеное мясо из окорочков индейки (морковь, паприка)', 'Turkey thigh meat stew (carrots, bell pepper)'),
('Kopūstų,agurkų, pomidorų ir paprikų salotos', 'Салат из капусты, огурцов, помидоров и перца', 'Cabbage, cucumber, tomato and bell pepper salad');
