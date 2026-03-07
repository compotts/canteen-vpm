export const CATEGORY_IDS = ["sriubos", "main", "salotos", "drinks", "other"];
export const catalogByCategory = {
  sriubos: [
    { id: 's1', name: 'Agurkinė sriuba', nameRu: 'Огуречный суп', weight: '250/20', priceStudent: 0.25, priceTeacher: 0.28 },
    { id: 's2', name: 'Barščiai su pupelemis', nameRu: 'Борщ с фасолью', weight: '250/20', priceStudent: 0.31, priceTeacher: 0.34 },
    { id: 's3', name: 'Bulvių sriuba su lęšiais', nameRu: 'Картофельный суп с чечевицей', weight: '250', priceStudent: 0.22, priceTeacher: 0.22 },
    { id: 's4', name: 'Bulvių sriuba su mėsos kukuliukais', nameRu: 'Картофельный суп с фрикадельками', weight: '250', priceStudent: 0.57, priceTeacher: 0.63 },
    { id: 's5', name: 'Bulvių sriuba su pupelėmis', nameRu: 'Картофельный суп с фасолью', weight: '250', priceStudent: 0.21, priceTeacher: 0.23 },
    { id: 's6', name: 'Burokėlių sriuba su grietine', nameRu: 'Свекольник со сметаной', weight: '250/20', priceStudent: 0.35, priceTeacher: 0.39 },
    { id: 's7', name: 'Burokėlių sriuba su pupelėmis', nameRu: 'Свекольный суп с фасолью', weight: '250/20', priceStudent: 0.36, priceTeacher: 0.4 },
    { id: 's8', name: 'Daržovių ir viso grūdo makaronų sriuba', nameRu: 'Суп из овощей и цельнозерновых макарон', weight: '250', priceStudent: 0.37, priceTeacher: 0.41 },
    { id: 's9', name: 'Lakštinių sriuba su grybais', nameRu: 'Суп с лапшой и грибами', weight: '250', priceStudent: 0.22, priceTeacher: 0.24 },
    { id: 's10', name: 'Naminė agurkė sriuba', nameRu: 'Домашний огуречный суп', weight: '250/20', priceStudent: 0.39, priceTeacher: 0.43 },
    { id: 's11', name: 'Naminė šiupininė sriuba', nameRu: 'Домашний суп с перловой крупой', weight: '250', priceStudent: 0.67, priceTeacher: 0.74 },
    { id: 's12', name: 'Naminių lakštinių sriuba su vištiena', nameRu: 'Домашний суп с лапшой и курицей', weight: '250', priceStudent: 0.3, priceTeacher: 0.33 },
    { id: 's13', name: 'Netikras zuikis su kiauliena', nameRu: 'Зайчик с свининой', weight: '100', priceStudent: 0.94, priceTeacher: 1.03 },
    { id: 's14', name: 'Pertrinta brokolių sriuba', nameRu: 'Суп-пюре из брокколи', weight: '250', priceStudent: 0.37, priceTeacher: 0.41 },
    { id: 's15', name: 'Pertrinta grybu sriuba', nameRu: 'Грибной суп-пюре', weight: '250/20', priceStudent: 0.48, priceTeacher: 0.53 },
    { id: 's16', name: 'Pieniška grikių kruopų sriuba su sviestu', nameRu: 'Молочный суп из гречки со сливочным маслом', weight: '250', priceStudent: 0.3, priceTeacher: 0.33 },
    { id: 's17', name: 'Pieniška makaronų sriuba', nameRu: 'Молочный суп с макаронами', weight: '150', priceStudent: 0.1, priceTeacher: 0.11 },
    { id: 's18', name: 'Pieniška ryžių sriuba', nameRu: 'Молочный рисовый суп', weight: '250', priceStudent: 0.09, priceTeacher: 0.1 },
    { id: 's19', name: 'Poltavos barščiai', nameRu: 'Полтавский борщ', weight: '250/20', priceStudent: 0.19, priceTeacher: 0.21 },
    { id: 's20', name: 'Pupelių sriuba su bulvėmis', nameRu: 'Фасолевый суп с картофелем', weight: '250', priceStudent: 0.17, priceTeacher: 0.19 },
    { id: 's21', name: 'Pupelių sriuba su bulvėmis ir cukinijomis', nameRu: 'Фасолевый суп с картофелем и кабачками', weight: '250', priceStudent: 0.43, priceTeacher: 0.47 },
    { id: 's22', name: 'Raugintų kopūstų sriuba', nameRu: 'Суп из квашеной капусты', weight: '250/20', priceStudent: 0.44, priceTeacher: 0.48 },
    { id: 's23', name: 'Raugintų kopūstų sriuba su grietine', nameRu: 'Суп из квашеной капусты со сметаной', weight: '250/20', priceStudent: 0.53, priceTeacher: 0.58 },
    { id: 's24', name: 'Rūgštynių sriuba su grietine', nameRu: 'Щавелевый суп со сметаной', weight: '250/20', priceStudent: 0.43, priceTeacher: 0.47 },
    { id: 's25', name: 'Rūgštynių sriuba su tomatu', nameRu: 'Щавелевый суп с томатом', weight: '250/20', priceStudent: 0.37, priceTeacher: 0.41 },
    { id: 's26', name: 'Šaltibarščiai', nameRu: 'Холодный борщ (шалтибарщяй)', weight: '250/10/20', priceStudent: 0.77, priceTeacher: 0.85 },
    { id: 's27', name: 'Sibiro barščiai', nameRu: 'Сибирский борщ', weight: '250/20', priceStudent: 0.12, priceTeacher: 0.13 },
    { id: 's28', name: 'Šiupininė sriuba', nameRu: 'Суп с перловой крупой', weight: '250/10', priceStudent: 0.55, priceTeacher: 0.61 },
    { id: 's29', name: 'Sriuba „Charčio“', nameRu: 'Суп харчо', weight: '250', priceStudent: 0.78, priceTeacher: 0.86 },
    { id: 's30', name: 'Sultinys su kepta juoda duona', nameRu: 'Бульон с чёрным хлебом', weight: '200/50', priceStudent: 0.1, priceTeacher: 0.11 },
    { id: 's31', name: 'Sultinys su pakepinta balta duona', nameRu: 'Бульон с гренками', weight: '200/30', priceStudent: 0.14, priceTeacher: 0.15 },
    { id: 's32', name: 'Šv.daržovių sriuba', nameRu: 'Светлый овощной суп', weight: '250/20', priceStudent: 0.4, priceTeacher: 0.44 },
    { id: 's33', name: 'Šviežių kopūstų sriuba', nameRu: 'Суп из свежей капусты', weight: '250', priceStudent: 0.4, priceTeacher: 0.44 },
    { id: 's34', name: 'Šviežių kopūstų sriuba su grietine', nameRu: 'Суп из свежей капусты со сметаной', weight: '250/20', priceStudent: 0.45, priceTeacher: 0.5 },
    { id: 's35', name: 'Tiršta agurkinė sriuba(bulv,mork,perl.kruop)', nameRu: 'Густой огуречный суп (картофель, морковь, перловка)', weight: '250/20', priceStudent: 0.39, priceTeacher: 0.43 },
    { id: 's36', name: 'Tiršta burokėlių ir pupelių sriuba su bulvėmis.', nameRu: 'Густой свекольно-фасолевый суп с картофелем', weight: '250/20', priceStudent: 0.42, priceTeacher: 0.46 },
    { id: 's37', name: 'Trinta cukinijų sriuba', nameRu: 'Суп-пюре из кабачков', weight: '250', priceStudent: 0.45, priceTeacher: 0.5 },
    { id: 's38', name: 'Trinta daržovių sriuba', nameRu: 'Овощной суп-пюре', weight: '250', priceStudent: 0.27, priceTeacher: 0.3 },
    { id: 's39', name: 'Trinta moliūgų sriuba', nameRu: 'Суп-пюре из тыквы', weight: '250/20', priceStudent: 0.42, priceTeacher: 0.46 },
    { id: 's40', name: 'Trinta pomidorų sriuba', nameRu: 'Томатный суп-пюре', weight: '250/20', priceStudent: 0.43, priceTeacher: 0.47 },
    { id: 's41', name: 'Trinta špinatų-žirnių sriuba', nameRu: 'Суп-пюре из шпината и гороха', weight: '250', priceStudent: 0.64, priceTeacher: 0.7 },
    { id: 's42', name: 'Trinta žiedinių kopūstų sriuba', nameRu: 'Суп-пюре из цветной капусты', weight: '300', priceStudent: 0.16, priceTeacher: 0.18 },
    { id: 's43', name: 'Trinta žiedinių kopūstų sriuba su pienu', nameRu: 'Суп-пюре из цветной капусты с молоком', weight: '250', priceStudent: 0.25, priceTeacher: 0.28 },
    { id: 's44', name: 'Ukrainietiški barščiai', nameRu: 'Украинский борщ', weight: '250/20', priceStudent: 0.35, priceTeacher: 0.39 },
    { id: 's45', name: 'Žirnių sriuba', nameRu: 'Гороховый суп', weight: '250', priceStudent: 0.19, priceTeacher: 0.21 },
    { id: 's46', name: 'Žirnių sriuba su bulvėmis ir morkomis', nameRu: 'Гороховый суп с картофелем и морковью', weight: '250', priceStudent: 0.17, priceTeacher: 0.19 },
  ],
  main: [
    { id: 'm1', name: 'Apkepta kiauliena su džiov. abrikosais', nameRu: 'Свинина с курагой', weight: '100/50', priceStudent: 1.93, priceTeacher: 2.12 },
    { id: 'm2', name: 'Apkepta kiaulienos sprandinė', nameRu: 'Жареная свиная шейка', weight: '100', priceStudent: 1.24, priceTeacher: 1.36 },
    { id: 'm3', name: 'Apkeptas kotletas su pieno padažu', nameRu: 'Котлета с молочным соусом', weight: '140', priceStudent: 0.88, priceTeacher: 0.97 },
    { id: 'm4', name: 'Balandėliai su padažu', nameRu: 'Голубцы с соусом', weight: '216/100', priceStudent: 1.09, priceTeacher: 1.1 },
    { id: 'm5', name: 'Befstrogenas', nameRu: 'Бефстроганов', weight: '75/75', priceStudent: 2.17, priceTeacher: 2.39 },
    { id: 'm6', name: 'Biguzas', nameRu: 'Бигус', weight: '275', priceStudent: 1.23, priceTeacher: 1.35 },
    { id: 'm7', name: 'Biri žalių grikių košė su sviestu(tausojantis)', nameRu: 'Гречневая каша со сливочным маслом', weight: '150', priceStudent: 0.41, priceTeacher: 0.45 },
    { id: 'm8', name: 'Bulgur su daržovėmis', nameRu: 'Булгур с овощами', weight: '150', priceStudent: 0.12, priceTeacher: 0.13 },
    { id: 'm9', name: 'Bulgur su sviestu', nameRu: 'Булгур со сливочным маслом', weight: '150', priceStudent: 0.21, priceTeacher: 0.23 },
    { id: 'm10', name: 'Bulvių blynai su grybais', nameRu: 'Картофельные оладьи с грибами', weight: '200/50', priceStudent: 0.65, priceTeacher: 0.72 },
    { id: 'm11', name: 'Bulvių dubenėliai su spirgūčiais ir grietine', nameRu: 'Картофельные крокеты со шкварками и сметаной', weight: '200/35/30', priceStudent: 1.05, priceTeacher: 1.1 },
    { id: 'm12', name: 'Bulvių ir morkų košė', nameRu: 'Картофельно-морковное пюре', weight: '150', priceStudent: 0.17, priceTeacher: 0.19 },
    { id: 'm13', name: 'Bulvių košė', nameRu: 'Картофельное пюре', weight: '150', priceStudent: 0.22, priceTeacher: 0.24 },
    { id: 'm14', name: 'Bulvių košė su sviestu', nameRu: 'Картофельное пюре со сливочным маслом', weight: '150', priceStudent: 0.22, priceTeacher: 0.24 },
    { id: 'm15', name: 'Bulvių plokštainis su grietine', nameRu: 'Картофельная запеканка со сметаной', weight: '200/50', priceStudent: 1.16, priceTeacher: 1.28 },
    { id: 'm16', name: 'Eskalopas su griet.-daržovių padažu', nameRu: 'Эскалоп с сметано-овощным соусом', weight: '100/50', priceStudent: 1.47, priceTeacher: 1.62 },
    { id: 'm17', name: 'Grietinelėje troškinta vištienos krūtinėlė su mork', nameRu: 'Куриная грудка в сметане с морковью', weight: '200', priceStudent: 1.3, priceTeacher: 1.43 },
    { id: 'm18', name: 'Grikių košė', nameRu: 'Гречневая каша', weight: '150', priceStudent: 0.2, priceTeacher: 0.22 },
    { id: 'm19', name: 'Grikių košė su morkomis ir svogūnais', nameRu: 'Гречневая каша с морковью и луком', weight: '150', priceStudent: 0.24, priceTeacher: 0.26 },
    { id: 'm20', name: 'Husaro šnicelis', nameRu: 'Шницель по-гусарски', weight: '120', priceStudent: 1.33, priceTeacher: 1.46 },
    { id: 'm21', name: 'Kiaulienos kepsnys', nameRu: 'Жареная свинина', weight: '100', priceStudent: 1.2, priceTeacher: 1.32 },
    { id: 'm22', name: 'Kiaulienos kotletas', nameRu: 'Свиная котлета', weight: '100', priceStudent: 0.59, priceTeacher: 0.65 },
    { id: 'm23', name: 'Lietuviškas karbonadas', nameRu: 'Литовский карбонад', weight: '100', priceStudent: 1.11, priceTeacher: 1.22 },
    { id: 'm24', name: 'Plovas', nameRu: 'Плов', weight: '350', priceStudent: 1.54, priceTeacher: 1.69 },
    { id: 'm25', name: 'Ryžių plovas su vištienos filė', nameRu: 'Рисовый плов с куриным филе', weight: '300', priceStudent: 1.65, priceTeacher: 1.81 },
    { id: 'm26', name: 'Virta vištienos filė', nameRu: 'Отварное куриное филе', weight: '100', priceStudent: 1.26, priceTeacher: 1.39 },
    { id: 'm27', name: 'Virti makaronai', nameRu: 'Отварные макароны', weight: '150', priceStudent: 0.2, priceTeacher: 0.22 },
    { id: 'm28', name: 'Virti ryžiai', nameRu: 'Отварной рис', weight: '150', priceStudent: 0.18, priceTeacher: 0.2 },
    { id: 'm29', name: 'Virtos bulvės', nameRu: 'Отварной картофель', weight: '150', priceStudent: 0.2, priceTeacher: 0.22 },
    { id: 'm30', name: 'Žemaičių blynai', nameRu: 'Жемайтийские оладьи', weight: '200/50', priceStudent: 1.52, priceTeacher: 1.67 },
  ],
  salotos: [
    { id: 'a1', name: 'Baltųjų ridikų ir morkų salotos', nameRu: 'Салат из редиса и моркови', weight: '130', priceStudent: 0.46, priceTeacher: 0.51 },
    { id: 'a2', name: 'Burokėliai su aliejumi', nameRu: 'Свёкла с маслом', weight: '100/10', priceStudent: 0.12, priceTeacher: 0.13 },
    { id: 'a3', name: 'Burokėlių salotos su raug.kopūstais', nameRu: 'Салат из свёклы с квашеной капустой', weight: '100', priceStudent: 0.23, priceTeacher: 0.25 },
    { id: 'a4', name: 'Daržovių salotos su alyv.aliejumi', nameRu: 'Овощной салат с оливковым маслом', weight: '140', priceStudent: 0.39, priceTeacher: 0.43 },
    { id: 'a5', name: 'Graikinės salotos', nameRu: 'Греческий салат', weight: '150', priceStudent: 0.94, priceTeacher: 1.03 },
    { id: 'a6', name: 'Itališkos salotos', nameRu: 'Итальянский салат', weight: '170', priceStudent: 1.01, priceTeacher: 1.11 },
    { id: 'a7', name: 'Kopūstų ir morkų salotos', nameRu: 'Салат из капусты и моркови', weight: '90', priceStudent: 0.19, priceTeacher: 0.21 },
    { id: 'a8', name: 'Kopūstų salotos su paprika', nameRu: 'Салат из капусты с перцем', weight: '100', priceStudent: 0.18, priceTeacher: 0.2 },
    { id: 'a9', name: 'Kopūstų salotos su pomidorais', nameRu: 'Салат из капусты с томатами', weight: '100', priceStudent: 0.19, priceTeacher: 0.21 },
    { id: 'a10', name: 'Mišrainė', nameRu: 'Винегрет', weight: '100', priceStudent: 0.23, priceTeacher: 0.25 },
    { id: 'a11', name: 'Salotos su Mozzarella', nameRu: 'Салат с моцареллой', weight: '130', priceStudent: 1.43, priceTeacher: 1.57 },
    { id: 'a12', name: 'Švieži agurkai', nameRu: 'Свежие огурцы', weight: '65', priceStudent: 0.13, priceTeacher: 0.14 },
    { id: 'a13', name: 'Šviežių kopūstų salotos', nameRu: 'Салат из свежей капусты', weight: '100', priceStudent: 0.17, priceTeacher: 0.19 },
    { id: 'a14', name: 'Vitaminizuotos salotos', nameRu: 'Витаминный салат', weight: '100', priceStudent: 0.12, priceTeacher: 0.13 },
  ],
  drinks: [
    { id: 'd1', name: 'Kefyras', nameRu: 'Кефир', weight: '200', priceStudent: 0.32, priceTeacher: 0.35 },
    { id: 'd2', name: 'Mineralinis negazuotas vanduo', nameRu: 'Минеральная вода без газа', weight: '200', priceStudent: 0.1, priceTeacher: 0.11 },
    { id: 'd3', name: 'Vaisių kompotas', nameRu: 'Фруктовый компот', weight: '180', priceStudent: 0.12, priceTeacher: 0.13 },
    { id: 'd4', name: 'Vanduo su citrina', nameRu: 'Вода с лимоном', weight: '200/5', priceStudent: 0.01, priceTeacher: 0.01 },
  ],
  other: [
    { id: 'o1', name: 'Kuskusas', nameRu: 'Кускус', weight: '150', priceStudent: 0.13, priceTeacher: 0.14 },
    { id: 'o2', name: 'Morkų -svog ir česnak.padažas su ciberžole', nameRu: 'Соус из моркови, лука и чеснока с укропом', weight: '60', priceStudent: 0.07, priceTeacher: 0.08 },
    { id: 'o3', name: 'Morkų ir svogūnų su česnaku padažas', nameRu: 'Соус из моркови и лука с чесноком', weight: '60', priceStudent: 0.04, priceTeacher: 0.04 },
    { id: 'o4', name: 'Nesaldintas jogurtas', nameRu: 'Несладкий йогурт', weight: '50', priceStudent: 0.33, priceTeacher: 0.36 },
    { id: 'o5', name: 'Švies. kviet. duona', nameRu: 'Белый пшеничный хлеб', weight: '20-25', priceStudent: 0.04, priceTeacher: 0.04 },
    { id: "o6", name: "Viso grūdo rūginė duona", nameRu: "Цельнозерновой ржаной хлеб", weight: "20-25", priceStudent: 0.04, priceTeacher: 0.04 },
  ],
  forTranslate: [
    { name: "Virtų burokėlių salotos su pupel.ir raug.agurk.", nameRu: "Салат из вареных свеклы с фасолью и маринованными огурцами" },
    { name: "Pomidorų -agurkų salotos su grietine", nameRu: "Салат из помидоров и огурцов со сметаной" },
    { name: "Silkė su daržovėmis", nameRu: "Сельдь с овощами" },
    { name: "Jogurtinis padažas", nameRu: "Йогуртовый соус" }
  ],
};

export function normalizeDishName(name) {
  return (name || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/u, "")
    .trim()
    .toLowerCase();
}

export const nameToRuMap = Object.freeze(
  Object.values(catalogByCategory)
    .flat()
    .reduce((acc, item) => {
      if (item.name && item.nameRu) {
        const key = normalizeDishName(item.name);
        if (key) acc[key] = item.nameRu;
      }
      return acc;
    }, {})
);
