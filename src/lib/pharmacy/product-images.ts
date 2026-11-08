// Illustrative catalog photographs. The product name, size and unit identify the requested material.
export type ProductImage={src:string;source:string;credit:string};
const images:Record<string,ProductImage>={
  "ACTICOAT FLEX 3 10X10, SU PRESCRIZIONE SPECIALISTICA": {
    "src": "https://www.marksteypharmacy.co.uk/cdn/shop/products/acticoatflex3.jpg?v=1618296497",
    "source": "https://www.marksteypharmacy.co.uk/products/acticoat-flex-3-dressings-different-sizes-uk-pharmacy-seller",
    "credit": "Marks Tey Pharmacy · Smith+Nephew"
  },
  "AQUACEL AG+EXTRA 10X10CM": {
    "src": "https://digitalassetcdn.net/958477e3-8eb8-4892-882e-b29a00ee8e59.jpg?fit=bounds&format=webp&height=300&quality=85&versionNumber=1&width=300",
    "source": "https://www.convatec.com/it-it/prodotti/gestione-avanzata-delle-lesioni/tipologia-di-lesione/pc-lesioni-cutanee-per-tipo-di-lesione-lesioni-da-pressione-di-l-e-ll-stadio/aquacel-ag-extra/",
    "credit": "Convatec"
  },
  "PRONTOSAN SOLUZIONE 350ML": {
    "src": "https://cdn.shopify.com/s/files/1/0012/8440/7394/files/braun-prontosan-wound-solution-braun-30515210092642.jpg?v=1716460639",
    "source": "https://www.medshop.com.au/products/braun-prontosan-wound-solution",
    "credit": "Medshop · B. Braun"
  },
  "URGOCLEAN AG": {
    "src": "https://urgomedical.it/wp-content/uploads/urgo-clean-ag-pack-01-200x200.jpg",
    "source": "https://urgomedical.it/prodotto/active-defense/urgoclean-ag/",
    "credit": "Urgo Medical"
  },
  "ABBASSALINGUA LEGNO STERILE": {
    "src": "https://www.lombardah.com/790-large_default/abbassalingua.jpg",
    "source": "https://www.lombardah.com/it/dispositivi-medici-e-monouso/11054-abbassalingua.html",
    "credit": "www.lombardah.com"
  },
  "ACQUA BORICA": {
    "src": "https://farma-web.it/image/cache/data/pharmadb/030318024-500x500.jpg",
    "source": "https://farma-web.it/acqua-borica-mv3-500ml",
    "credit": "farma-web.it"
  },
  "ACQUA OSSIGENATA 250ML": {
    "src": "https://risorse.doctorshop.it/images/8255/2",
    "source": "https://www.doctorshop.it/Prodotti/disinfezione-ST/disinfettanti-ST-7/per-la-cute-st-7-01/acqua-ossigenata-250-ml-102397",
    "credit": "www.doctorshop.it"
  },
  "ACTICOAT GARZE 5X5CM, SU PRESCRIZIONE SPECIALISTICA": {
    "src": "https://amamedicalproducts.com.au/cdn/shop/files/DRESSING_SMITH_NEPHEW_ACTICOAT_3-DAY_NANOCRYSTALLINE_SILVER_ANTIMICROBIAL_BARRIER_5X5CM_PRODUCT_02_750x.png?v=1706847505",
    "source": "https://amamedicalproducts.com.au/products/smith-and-nephew-acticoat-wound-dressing",
    "credit": "Fotografia di catalogo"
  },
  "ACTISORB 10,5X10,5CM, SU PRESCRIZIONE SPECIALISTICA": {
    "src": "https://d2j6dbq0eux0bg.cloudfront.net/images/84799295/3770799656.jpg",
    "source": "https://www.optimi-sante-33.fr/boutique/PANSEMENT-AU-CHARBON-ACTIVE-ACTISORB-r-p576959201",
    "credit": "www.optimi-sante-33.fr"
  },
  "ADATTORI LUER ADAPTER": {
    "src": "https://media.praxisdienst.com/praxident-prod-public-files/media/69/52/8e/1740365869/7260-142168-bd-vacutainer-blutennahmekanuele.jpg?ts=1784839217",
    "source": "https://www.praxisdienst.com/es-es/producto/bd-vacutainer-sst-ii-advance-8-5-ml/143424",
    "credit": "www.praxisdienst.com"
  },
  "AGHI A FARFALLA - AZZURRI G23": {
    "src": "https://www.solumedica.cl/cdn/shop/products/SCALPVEINWEB_f6cf31db-6a93-415a-af42-a2893e55a767_large.jpg?v=1618341407",
    "source": "https://www.solumedica.cl/products/copia-de-mariposa-scalp-vein-pack-x-100u",
    "credit": "www.solumedica.cl"
  },
  "AGHI A FARFALLA - VERDI G21": {
    "src": "https://www.solumedica.cl/cdn/shop/products/SCALPVEINWEB_f6cf31db-6a93-415a-af42-a2893e55a767_large.jpg?v=1618341407",
    "source": "https://www.solumedica.cl/products/copia-de-mariposa-scalp-vein-pack-x-100u",
    "credit": "www.solumedica.cl"
  },
  "AGHI A FARFALLA - GIALLI G19": {
    "src": "https://www.solumedica.cl/cdn/shop/products/SCALPVEINWEB_f6cf31db-6a93-415a-af42-a2893e55a767_large.jpg?v=1618341407",
    "source": "https://www.solumedica.cl/products/copia-de-mariposa-scalp-vein-pack-x-100u",
    "credit": "www.solumedica.cl"
  },
  "AGHI CANNULA VERDI G18": {
    "src": "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/91/MTA-49223215/terumo_surflo-iv-catheter-18g-20g-22g-24g-terumo-abbocath-terumo-jarum-infu_full04.jpg",
    "source": "https://www.blibli.com/p/surflo-iv-catheter-18g-20g-22g-24g-terumo-abbocath-terumo-jarum-infu/ps--THG-70049-00093",
    "credit": "www.blibli.com"
  },
  "AGHI CANNULA ROSA G20": {
    "src": "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/91/MTA-49223215/terumo_surflo-iv-catheter-18g-20g-22g-24g-terumo-abbocath-terumo-jarum-infu_full04.jpg",
    "source": "https://www.blibli.com/p/surflo-iv-catheter-18g-20g-22g-24g-terumo-abbocath-terumo-jarum-infu/ps--THG-70049-00093",
    "credit": "www.blibli.com"
  },
  "AGHI CANNULA AZZURRI G22": {
    "src": "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/91/MTA-49223215/terumo_surflo-iv-catheter-18g-20g-22g-24g-terumo-abbocath-terumo-jarum-infu_full04.jpg",
    "source": "https://www.blibli.com/p/surflo-iv-catheter-18g-20g-22g-24g-terumo-abbocath-terumo-jarum-infu/ps--THG-70049-00093",
    "credit": "www.blibli.com"
  },
  "AGHI CANNULA GIALLI G24": {
    "src": "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/91/MTA-49223215/terumo_surflo-iv-catheter-18g-20g-22g-24g-terumo-abbocath-terumo-jarum-infu_full04.jpg",
    "source": "https://www.blibli.com/p/surflo-iv-catheter-18g-20g-22g-24g-terumo-abbocath-terumo-jarum-infu/ps--THG-70049-00093",
    "credit": "www.blibli.com"
  },
  "AMUKINE MED 250ML 0,05%": {
    "src": "https://cdn.redcare.it/images/IT0/321/920/15/IT032192015-p12.jpg",
    "source": "https://www.redcare.it/medicinali/IT032192015/amukine-med-0-05-soluzione-cutanea.htm",
    "credit": "www.redcare.it"
  },
  "AQUACEL EXTRA 10X10CM": {
    "src": "https://cdn.webshopapp.com/shops/266138/files/492147226/650x650x2/aposito-aquacel-extra-de-hidrofibra-con-refuerzo-1.jpg",
    "source": "https://www.vitadvice.com/es/aposito-aquacel-extra-de-hidrofibra-con-refuerzo-1.html",
    "credit": "www.vitadvice.com"
  },
  "BENDE ALL’OSSIDO DI ZINCO 10X5CM": {
    "src": "https://www.csipoint.it/27648-large_default/benda-all-ossido-di-zinco-10cm-x-5m.jpg",
    "source": "https://www.csipoint.it/2037-benda-all-ossido-di-zinco-10cm-x-5m.html",
    "credit": "www.csipoint.it"
  },
  "BENDE COESIVE 20MX10CM": {
    "src": "https://farmavola.it/image/cache/data/farmadati/283997-720x720.jpg",
    "source": "https://farmavola.it/benda-coesiva-unidea-cm-10-x-4-m-2",
    "credit": "farmavola.it"
  },
  "BENDE ORLATE DA 5X5CM": {
    "src": "https://www.farmaciadifiducia.com/media/catalog/product/p/r/prontex_benda_orlata_garza_cotone_10cmx5m-articoli_sanitari-909385039-1.jpg",
    "source": "https://www.farmaciadifiducia.com/it/prontex-benda-orlata-garza-cotone-10cmx5m.html",
    "credit": "www.farmaciadifiducia.com"
  },
  "BENDE ORLATE DA 7X5CM": {
    "src": "https://www.farmaciadifiducia.com/media/catalog/product/p/r/prontex_benda_orlata_garza_cotone_10cmx5m-articoli_sanitari-909385039-1.jpg",
    "source": "https://www.farmaciadifiducia.com/it/prontex-benda-orlata-garza-cotone-10cmx5m.html",
    "credit": "www.farmaciadifiducia.com"
  },
  "BENDE ORLATE DA 10X5CM": {
    "src": "https://www.farmaciadifiducia.com/media/catalog/product/p/r/prontex_benda_orlata_garza_cotone_10cmx5m-articoli_sanitari-909385039-1.jpg",
    "source": "https://www.farmaciadifiducia.com/it/prontex-benda-orlata-garza-cotone-10cmx5m.html",
    "credit": "www.farmaciadifiducia.com"
  },
  "BETADINE GARZE 10X10CM": {
    "src": "https://www.pharmaserena.it/6273-large_default/betadine-10-impregnated-gauzes-10x10-cm.jpg",
    "source": "https://www.pharmaserena.it/en/other-ailments/2666-betadine-10-impregnated-gauzes-10x10-cm.html",
    "credit": "www.pharmaserena.it"
  },
  "BIONECT START TUBO 30G": {
    "src": "https://farmaciabagheria.it/image/data/pharmadb/938650025.jpg",
    "source": "https://farmaciabagheria.it/bionect-start-unguento-30-g",
    "credit": "farmaciabagheria.it"
  },
  "BISTURI MONOUSO": {
    "src": "https://cdn.shopify.com/s/files/1/0341/1692/7628/files/Disposable10.jpg",
    "source": "https://www.ebay.com/itm/DISPOSABLE-STERILE-SCALPEL-WITH-A-10-BLADE/333530348128",
    "credit": "www.ebay.com"
  },
  "BORSA PRELIEVI (GRANDE 80 POSTI)": {
    "src": "https://www.firstaidshop.gr/images/detailed/57/02-EB04.010-rows-xl-bolsa-tubos-muestras-elite-bags-open_1.jpg",
    "source": "https://www.firstaidshop.gr/elite-bags-rows-xl-tsanta-iatrikon-episkepseon-metaforas-biologikoy-ylikoy-el-3.html",
    "credit": "www.firstaidshop.gr"
  },
  "CAMICE X PRELIEVI": {
    "src": "https://www.praxispanda.de/thumbnail/af/d7/0e/1764683562/teqler-einwegkittel-pp-vlies-blau-115cm-100st-a0de81229af51ea06a7ee0b463d41f81_1920x1920.jpg",
    "source": "https://www.praxispanda.de/teqler-einwegkittel-aus-virgin-pp-vlies-25197M",
    "credit": "Fotografia di catalogo"
  },
  "CARBOFLEX 10X10CM": {
    "src": "https://statics.promofarma.com/static/promofarma/prod/product_images/mr/W2HZYX_fr_FR_7.jpg",
    "source": "https://www.promofarma.com/de/convatec-carboflex-dressing-10x10cm-10unts/p-409458",
    "credit": "www.promofarma.com"
  },
  "CATETERE FOLEY LATTICE 14": {
    "src": "https://farmahome.it/cdn/shop/files/SECURMED_20CATETERE_20FOLEY_20LATTICE_202_20VIE_20CH18.jpg?v=1737792250",
    "source": "https://farmahome.it/products/securmed-catetere-foley-2v-ch18",
    "credit": "farmahome.it"
  },
  "CATETERE FOLEY LATTICE 16": {
    "src": "https://farmahome.it/cdn/shop/files/SECURMED_20CATETERE_20FOLEY_20LATTICE_202_20VIE_20CH18.jpg?v=1737792250",
    "source": "https://farmahome.it/products/securmed-catetere-foley-2v-ch18",
    "credit": "farmahome.it"
  },
  "CATETERE FOLEY LATTICE 18": {
    "src": "https://farmahome.it/cdn/shop/files/SECURMED_20CATETERE_20FOLEY_20LATTICE_202_20VIE_20CH18.jpg?v=1737792250",
    "source": "https://farmahome.it/products/securmed-catetere-foley-2v-ch18",
    "credit": "farmahome.it"
  },
  "CATETERE FOLEY LATTICE 20": {
    "src": "https://farmahome.it/cdn/shop/files/SECURMED_20CATETERE_20FOLEY_20LATTICE_202_20VIE_20CH18.jpg?v=1737792250",
    "source": "https://farmahome.it/products/securmed-catetere-foley-2v-ch18",
    "credit": "farmahome.it"
  },
  "CATETERE FOLEY SILICONE 14": {
    "src": "https://www.matsuyoshi.co.jp/files/item/item-images/00888693_main.jpg",
    "source": "https://mysco.jp/25-3850-04/",
    "credit": "mysco.jp"
  },
  "CATETERE FOLEY SILICONE 16": {
    "src": "https://www.matsuyoshi.co.jp/files/item/item-images/00888693_main.jpg",
    "source": "https://mysco.jp/25-3850-04/",
    "credit": "mysco.jp"
  },
  "CATETERE FOLEY SILICONE 18": {
    "src": "https://www.matsuyoshi.co.jp/files/item/item-images/00888693_main.jpg",
    "source": "https://mysco.jp/25-3850-04/",
    "credit": "mysco.jp"
  },
  "CATETERE FOLEY SILICONE 20": {
    "src": "https://www.matsuyoshi.co.jp/files/item/item-images/00888693_main.jpg",
    "source": "https://mysco.jp/25-3850-04/",
    "credit": "mysco.jp"
  },
  "CATETERE FOLEY SILICONE 22": {
    "src": "https://www.matsuyoshi.co.jp/files/item/item-images/00888693_main.jpg",
    "source": "https://mysco.jp/25-3850-04/",
    "credit": "mysco.jp"
  },
  "CATETERE X CATETERISMO ESTEMPORANEO DONNA": {
    "src": "https://medifacil.com/cdn/shop/files/genecicoUrinario_999fa2c3-29df-4eb9-8c83-008987b531f9.png?v=1780522073",
    "source": "https://medifacil.com/products/convatec-cateter-urinario-intermitente-femenino-gentlecath-ch10",
    "credit": "medifacil.com"
  },
  "CATETERE X CATETERISMO ESTEMPORANEO UOMO": {
    "src": "https://shop.mtrb.ru/upload/resize_cache/iblock/7c8/7t8w5qxvb6jbfsfgigjdfrkrg7n1ghop/620_620_1/6591802464.jpg",
    "source": "https://shop.mtrb.ru/katalog/katetery_i_zondy_/kateter_nelaton_muzhskoy_urologicheskiy_40sm_1/",
    "credit": "shop.mtrb.ru"
  },
  "CEROTTO TNT 10X10CM": {
    "src": "https://farmaciaguacci.it/image/cache/cc/931988556/931988556-750x750.jpg",
    "source": "https://farmaciaguacci.it/meds-cerotto-ipoall5x5-bianco",
    "credit": "farmaciaguacci.it"
  },
  "CEROTTO TNT 15X10CM": {
    "src": "https://farmaciaguacci.it/image/cache/cc/931988556/931988556-750x750.jpg",
    "source": "https://farmaciaguacci.it/meds-cerotto-ipoall5x5-bianco",
    "credit": "farmaciaguacci.it"
  },
  "CEROTTO TNT 20X10CM": {
    "src": "https://farmaciaguacci.it/image/cache/cc/931988556/931988556-750x750.jpg",
    "source": "https://farmaciaguacci.it/meds-cerotto-ipoall5x5-bianco",
    "credit": "farmaciaguacci.it"
  },
  "CEROTTO TNT PRELIEVI 2,5X9,14CM": {
    "src": "https://assets.efarma.com/transform/7f252a23-f1cf-485f-913b-b4bd12e27d1f/?io=transform%3Aextend%2Cwidth%3A400%2Cheight%3A400",
    "source": "https://www.efarma.com/efarmamed-cerotto-su-rocchetto-in-tnt-5cmx5m.html",
    "credit": "www.efarma.com"
  },
  "CLISMA LAX 120ML": {
    "src": "https://openfarma.it/image/cache/data/pharmadb/024995033-900x900.jpg",
    "source": "https://openfarma.it/clismalax-soluzione-rettale-1-flacone-da-133-ml",
    "credit": "openfarma.it"
  },
  "CONDRESS": {
    "src": "https://cdn.shopify.com/s/files/1/0884/1009/5914/files/50740_1.jpg?bg-color=255%2C255%2C255&canvas=700%3A700&fit=bounds&height=700&quality=100&v=1766012703&width=700",
    "source": "https://www.amicafarmacia.com/condress-medicazione-collagene-equino-5x5-3-pezzi.html",
    "credit": "www.amicafarmacia.com"
  },
  "CONNETTIVINA CREMA 15G": {
    "src": "https://www.pharmaserena.it/5812-large_default/connettivina-creme-15g-tube.jpg",
    "source": "https://www.pharmaserena.it/de/andere-krankheiten/2908-connettivina-creme-15g-tube.html",
    "credit": "www.pharmaserena.it"
  },
  "CONNETTIVINA GARZE 10X10CM": {
    "src": "https://www.farmaciamato.it/52485-large_default/connettivina-10garze-2mg-10x10.jpg",
    "source": "https://www.farmaciamato.it/farmaci/19875057-connettivina-10garze-2mg-10x10.html?srsltid=AfmBOopjSGrkcdu26zLpZIWfMe6PySd6JdsGDpVc50fxMUw2XF-nW5rW",
    "credit": "www.farmaciamato.it"
  },
  "CONNETTIVINA PLUS CREMA 25G": {
    "src": "https://cdn.redcare.it/images/IT0/284/400/30/IT028440030-p1.jpg",
    "source": "https://www.redcare.it/medicinali/IT028440030/conettivina-plus-2-mg-g-10-mg-g-crema.htm",
    "credit": "www.redcare.it"
  },
  "CONNETTIVINA PLUS GARZE": {
    "src": "https://cdn.shop-apotheke.com/images/IT0/284/400/79/IT028440079-p15.jpg",
    "source": "https://www.redcare.it/medicinali/IT028440079/connettivina-plus-garze-impregnate-2-mg-40-mg.htm",
    "credit": "www.redcare.it"
  },
  "CONTA GOCCE (REGOLATORE DI FLUSSO MASTER FLOW)": {
    "src": "https://www.multimedical.it/pr/4/96.jpg",
    "source": "https://www.multimedical.it/regolatori-di-flusso.php",
    "credit": "Fotografia di catalogo"
  },
  "CONTENITORI AGHI USATI (AGHIBOX) 1,5 LT": {
    "src": "https://www.dentalgooddeal.com/images_upload/20160407/35975_original.jpg",
    "source": "https://www.dentalgooddeal.com/article_collecteur_d_aiguilles__sanibox_169798_88993_62654.html",
    "credit": "www.dentalgooddeal.com"
  },
  "CONTENITORI AGHI USATI (AGHIBOX) 3 LT": {
    "src": "https://www.dentalgooddeal.com/images_upload/20160407/35975_original.jpg",
    "source": "https://www.dentalgooddeal.com/article_collecteur_d_aiguilles__sanibox_169798_88993_62654.html",
    "credit": "www.dentalgooddeal.com"
  },
  "COTONE GERMANICO H 10": {
    "src": "https://farmacialoreto.es/image/cache/data/909971677-735x735.jpeg",
    "source": "https://farmacialoreto.es/vendaje-de-seguridad-algodon-de-alemania-10cm?srsltid=AfmBOorm2iifH3WEOZvqJXFPaiVtrD0L9DWKzDJwJjprNrMGlk1eT9_5",
    "credit": "farmacialoreto.es"
  },
  "COTONE GERMANICO H 15": {
    "src": "https://farmacialoreto.es/image/cache/data/909971677-735x735.jpeg",
    "source": "https://farmacialoreto.es/vendaje-de-seguridad-algodon-de-alemania-10cm?srsltid=AfmBOorm2iifH3WEOZvqJXFPaiVtrD0L9DWKzDJwJjprNrMGlk1eT9_5",
    "credit": "farmacialoreto.es"
  },
  "COTONE IDROFILO 1KG": {
    "src": "https://www.almamedical.net/312-large_default/ormed-pacco-di-cotone-idrofilo-da-1kg.jpg",
    "source": "https://www.almamedical.net/prodotti-medicali/ormed-pacco-di-cotone-idrofilo-da-1kg-5600.html",
    "credit": "Fotografia di catalogo"
  },
  "CUTIMED SORBACT 2X50CM ZAFFO SU PRESCRIZIONE SPECIALISTICA": {
    "src": "https://www.summitsurgical.co.za/wp-content/uploads/2023/12/7216600-Sorbact-Ribbon-gauze-scaled.jpeg",
    "source": "https://storage.googleapis.com/dtfzmmblroique/ribbon-gauze-roll.html",
    "credit": "storage.googleapis.com"
  },
  "CUTIMED SORBACT ASS. 7X9CM, SU PRESCRIZIONE SPECIALISTICA": {
    "src": "https://www.easymedshealth.com/cdn/shop/files/BSN_Cutimed_Sorbact_Dressing_Pads_10_cm_x_10_cm_x5_-_EasyMeds_Pharmacy-25796.jpg?v=1764073400",
    "source": "https://www.easymedshealth.com/products/bsn-cutimed-sorbact-dressing-pads-10-cm-x-10-cm-x5-wounds-ulcers-diabetic",
    "credit": "www.easymedshealth.com"
  },
  "CUTIMED SORBACT ASS. 10X10CM, SU PRESCRIZIONE SPECIALISTICA": {
    "src": "https://www.easymedshealth.com/cdn/shop/files/BSN_Cutimed_Sorbact_Dressing_Pads_10_cm_x_10_cm_x5_-_EasyMeds_Pharmacy-25796.jpg?v=1764073400",
    "source": "https://www.easymedshealth.com/products/bsn-cutimed-sorbact-dressing-pads-10-cm-x-10-cm-x5-wounds-ulcers-diabetic",
    "credit": "www.easymedshealth.com"
  },
  "CUTIMED SORBACT NON ASS. 7X9CM, SU PRESCRIZIONE SPECIALISTICA": {
    "src": "https://medical-images.essity.com/images-c5/976/556976/optimized-AzurePNG2K/thumbnail-cutimed-sorbact-contact.png?h=10000&imPolicy=dynamic&w=708",
    "source": "https://www.cutimed.com.au/products/manage-infection/bacteria-binding-wound-contact-layer/cutimed-sorbact/cutimed-sorbact-contact",
    "credit": "www.cutimed.com.au"
  },
  "DEFLUSSORI ROLLER": {
    "src": "https://farmacialoreto.it/image/cache/catalog/products/458462/deflussore-filtro-roller-ll-lf-claire-lombardah-25pezzi-735x735.jpg",
    "source": "https://farmacialoreto.it/set-infusionale-roller-luer-l",
    "credit": "farmacialoreto.it"
  },
  "DISINFETTANTE CUTE 250ML": {
    "src": "https://www.tuttofarma.it/104392-large_default/lysoform-medical-cute-disinfettante-pelle-250ml.jpg",
    "source": "https://www.tuttofarma.it/disinfettanti-per-la-pelle-e-per-le-mani/113335-lysoform-medical-cute-disinfettante-pelle-250ml-8051084914341.html",
    "credit": "Fotografia di catalogo"
  },
  "DUODERM CGF SENZA BORDO ADESIVO 10X10CM": {
    "src": "https://medcare.cl/cdn/shop/files/ApositoDuodermCGF10x10cm.png?v=1728592139&width=800",
    "source": "https://medcare.cl/products/duoderm-cgf",
    "credit": "medcare.cl"
  },
  "DUODERM EXTRA SOTTILE 10X10CM": {
    "src": "https://www.farmasiet.no/images/duoderm-ekstra-tynn-bandasje-10x10-cm%2C31775_885145.jpg?format=jpg&w=490",
    "source": "https://www.farmasiet.no/catalog/stomi-inkontinens-og-kateter/stomiutstyr/duoderm-ekstra-tynn-bandasje-10x10-cm%2C5000640",
    "credit": "www.farmasiet.no"
  },
  "DUODERM IDROGEL TUBO 15GR": {
    "src": "https://cdn.redcare.it/images/IT9/016/728/40/IT901672840-p12.jpg",
    "source": "https://www.redcare.it/articoli-sanitari/IT901672840/medicazione-idrogel-duoderm-con-applicatore-sterile-1-pezzo-15-g.htm",
    "credit": "www.redcare.it"
  },
  "ECOLAVAGGIO 100ML": {
    "src": "https://media.praxisdienst.com/praxident-prod-public-files/media/2b/7c/9f/1740368569/18971-143884-aqua-bbraun-ecolav-100ml_web.jpg?ts=1775943269",
    "source": "https://www.praxisdienst.com/lu-de/produit/aqua-b.-braun-ecolav/ex-143884",
    "credit": "www.praxisdienst.com"
  },
  "FARMACTIVE ALGINATO DI CALCIO SENZA ARGENTO": {
    "src": "https://cdn.redcare-apotheke.ch/images/IT9/037/042/21/IT903704221-p14.jpg",
    "source": "https://www.redcare-apotheke.ch/de/gesundheit/IT903704221/farmactive-alginat-verband-10-x-10-cm.htm",
    "credit": "www.redcare-apotheke.ch"
  },
  "FARMACTIVE GARZE GRASSE 10X10CM": {
    "src": "https://www.farmaciauno.it/media/catalog/product/cache/e403028fbb11a478ce331f156d2022fa/9/7/974890612.jpg",
    "source": "https://www.farmaciauno.it/farmactive-garza-paraffinata-sterile-10x10-cm-scatola-36-pezzi-meds-974890612.html",
    "credit": "www.farmaciauno.it"
  },
  "FARMACTIVE SCHIUMA POLIURETANO NON ADESIVO 10X10CM": {
    "src": "https://www.granfarma.it/6295955-thickbox_default/cerotto-farmactive-schiuma-in-poliuretano-10x10-cm-10-pezzi.jpg",
    "source": "https://www.granfarma.it/prodotti-per-medicazione-avanzata/50565-cerotto-farmactive-schiuma-in-poliuretano-10x10-cm-10-pezzi-8000246006059.html",
    "credit": "www.granfarma.it"
  },
  "FONENDOSCOPIO": {
    "src": "https://www.equipomedicoconsultoria.com.mx/wp-content/uploads/2017/03/estetoscopio_clasico_E700-estetoscopio_clasico_E700_mexico-estetoscopio_clasico_E700_hergom-equipo_medico_consultoria.png",
    "source": "https://www.equipomedicoconsultoria.com.mx/producto/estetoscopio-adulto-clasico-hergom-e700/",
    "credit": "www.equipomedicoconsultoria.com.mx"
  },
  "GARZA NON STERILE PACCO DA 1 KG 10X10CM": {
    "src": "https://farmaciairisdiana.it/588579-large_default/garza-prontex-20x20cm-1kg.jpg",
    "source": "https://farmaciairisdiana.it/home/25046-garza-prontex-20x20cm-1kg-8052675160550.html",
    "credit": "farmaciairisdiana.it"
  },
  "GARZA NON STERILE PACCO DA 1 KG 20X20CM": {
    "src": "https://farmaciairisdiana.it/588579-large_default/garza-prontex-20x20cm-1kg.jpg",
    "source": "https://farmaciairisdiana.it/home/25046-garza-prontex-20x20cm-1kg-8052675160550.html",
    "credit": "farmaciairisdiana.it"
  },
  "GARZA NON STERILE PACCO DA 1 KG 30X30CM": {
    "src": "https://farmaciairisdiana.it/588579-large_default/garza-prontex-20x20cm-1kg.jpg",
    "source": "https://farmaciairisdiana.it/home/25046-garza-prontex-20x20cm-1kg-8052675160550.html",
    "credit": "farmaciairisdiana.it"
  },
  "GARZA STERILE 20X20 CM": {
    "src": "https://www.yzsumed.com/uploads/539.jpg",
    "source": "https://vi.yzsumed.com/sterile-gauze-swab-2-product/",
    "credit": "vi.yzsumed.com"
  },
  "GARZA STERILE 36X40CM": {
    "src": "https://www.yzsumed.com/uploads/539.jpg",
    "source": "https://vi.yzsumed.com/sterile-gauze-swab-2-product/",
    "credit": "vi.yzsumed.com"
  },
  "GARZA STERILE TNT CON BORDI 10X10CM": {
    "src": "https://www.beautycore.it/64287-thickbox_default/biodress-cerotti-postoperatori-sterili---8x10-cm-conf-50pz.jpg",
    "source": "https://www.beautycore.it/cerotti-post-operatori/15806---biodress-cerotti-postoperatori-sterili---8x10-cm-conf-50pz-8057014182996.html",
    "credit": "www.beautycore.it"
  },
  "GARZA STERILE TNT CON BORDO 10X20CM": {
    "src": "https://www.beautycore.it/64287-thickbox_default/biodress-cerotti-postoperatori-sterili---8x10-cm-conf-50pz.jpg",
    "source": "https://www.beautycore.it/cerotti-post-operatori/15806---biodress-cerotti-postoperatori-sterili---8x10-cm-conf-50pz-8057014182996.html",
    "credit": "www.beautycore.it"
  },
  "GERMOXID CLOREXIDINA 250 ML": {
    "src": "https://cdn.redcare.it/images/IT9/242/182/90/IT924218290-p16.jpg",
    "source": "https://www.redcare.it/articoli-sanitari/IT924218290/medipresteril-germoxid.htm",
    "credit": "www.redcare.it"
  },
  "GEL LUBRIFICANTE 5GR": {
    "src": "https://cdn.shopify.com/s/files/1/0606/9806/7168/products/Aquagel-Sachet---Lubricant-Jelly-_5g_-_x1_-1677865177.jpg",
    "source": "https://www.vyne.co.uk/products/aquagel-lubricant-jelly-x1",
    "credit": "www.vyne.co.uk"
  },
  "GENTAMICINA BETA CREMA": {
    "src": "https://www.euroserviziexport.com/web/image/product.template/928/image_1024?unique=3fadbc5",
    "source": "https://www.euroserviziexport.com/shop/sdf01033-gentalyn-beta-cream-0-1-0-1-30-g-928",
    "credit": "Fotografia di catalogo"
  },
  "GENTAMICINA CREMA": {
    "src": "https://static.prezzifarmaco.it/blog/wp-content/uploads/2019/01/Gentamicina-Crema-teva-Generico-770x413.png",
    "source": "https://www.prezzifarmaco.it/blog/farmaci/gentamicina/",
    "credit": "www.prezzifarmaco.it"
  },
  "GHIACCIO SECCO": {
    "src": "https://www.emeditalia.it/2622-large_default/ghiaccio-istantaneo-in-busta-tnt-25-pezzi.jpg",
    "source": "https://www.emeditalia.it/ghiaccio-istantaneo-in-busta-tnt-25-pezzi-248.html?srsltid=AfmBOoo45_4SIn1ibujxmPVonmkqxzbHiEknjtc5Dl4WxWAotB9q4Xvl",
    "credit": "www.emeditalia.it"
  },
  "GUANTI LATTICE MISURA S": {
    "src": "https://www.doctorstrong.fr/media/catalog/product/988-4035/image_gv/6258-100-Gants-en-latex-ultragrip-non-poudrEs---Taille-S-%28100%29-Cyber-HR_2.jpg?height=720&image-type=image&store=strong&width=626",
    "source": "https://www.doctorstrong.fr/gants_latex_ss_poudre.html",
    "credit": "www.doctorstrong.fr"
  },
  "GUANTI LATTICE MISURA M": {
    "src": "https://www.doctorstrong.fr/media/catalog/product/988-4035/image_gv/6258-100-Gants-en-latex-ultragrip-non-poudrEs---Taille-S-%28100%29-Cyber-HR_2.jpg?height=720&image-type=image&store=strong&width=626",
    "source": "https://www.doctorstrong.fr/gants_latex_ss_poudre.html",
    "credit": "www.doctorstrong.fr"
  },
  "GUANTI LATTICE MISURA L": {
    "src": "https://www.doctorstrong.fr/media/catalog/product/988-4035/image_gv/6258-100-Gants-en-latex-ultragrip-non-poudrEs---Taille-S-%28100%29-Cyber-HR_2.jpg?height=720&image-type=image&store=strong&width=626",
    "source": "https://www.doctorstrong.fr/gants_latex_ss_poudre.html",
    "credit": "www.doctorstrong.fr"
  },
  "GUANTI VINILE MISURA S": {
    "src": "https://www.secostore.it/media/catalog/product/cache/bee743dd7cfe1b68068ceeaf53e3aeec/d/v/dvipf_1_1.jpg",
    "source": "https://www.secostore.it/rays-vinyl-pf-type-45-guanto-in-vinile-senza-polvere-conf-100-pezzi.html",
    "credit": "www.secostore.it"
  },
  "GUANTI VINILE MISURA M": {
    "src": "https://www.secostore.it/media/catalog/product/cache/bee743dd7cfe1b68068ceeaf53e3aeec/d/v/dvipf_1_1.jpg",
    "source": "https://www.secostore.it/rays-vinyl-pf-type-45-guanto-in-vinile-senza-polvere-conf-100-pezzi.html",
    "credit": "www.secostore.it"
  },
  "GUANTI VINILE MISURA L": {
    "src": "https://www.secostore.it/media/catalog/product/cache/bee743dd7cfe1b68068ceeaf53e3aeec/d/v/dvipf_1_1.jpg",
    "source": "https://www.secostore.it/rays-vinyl-pf-type-45-guanto-in-vinile-senza-polvere-conf-100-pezzi.html",
    "credit": "www.secostore.it"
  },
  "GUANTI NITRILE MISURA S (SOLO SU ACCERTATA INTOLLERANZA AL VINILE/LATTICE)": {
    "src": "https://www.gerho.it/media/19/04/22/1686051205/c614de6ec1e74f6ca4252e96b0c39c0d.jpg",
    "source": "https://edentist.it/product/guanti-nitrile-39942-derma-nytril-taglia-xl-100pz/",
    "credit": "Fotografia di catalogo"
  },
  "GUANTI NITRILE MISURA M (SOLO SU ACCERTATA INTOLLERANZA AL VINILE/LATTICE)": {
    "src": "https://www.gerho.it/media/19/04/22/1686051205/c614de6ec1e74f6ca4252e96b0c39c0d.jpg",
    "source": "https://edentist.it/product/guanti-nitrile-39942-derma-nytril-taglia-xl-100pz/",
    "credit": "Fotografia di catalogo"
  },
  "GUANTI NITRILE MISURA L (SOLO SU ACCERTATA INTOLLERANZA AL VINILE/LATTICE)": {
    "src": "https://www.gerho.it/media/19/04/22/1686051205/c614de6ec1e74f6ca4252e96b0c39c0d.jpg",
    "source": "https://edentist.it/product/guanti-nitrile-39942-derma-nytril-taglia-xl-100pz/",
    "credit": "Fotografia di catalogo"
  },
  "GUANTI STERILI MISURA 6 ½": {
    "src": "https://meafarma.it/image/cache/data/pharmadb/909972756-900x900.jpg",
    "source": "https://meafarma.it/guanti-chir-sterili-75-12540",
    "credit": "meafarma.it"
  },
  "GUANTI STERILI MISURA 7": {
    "src": "https://meafarma.it/image/cache/data/pharmadb/909972756-900x900.jpg",
    "source": "https://meafarma.it/guanti-chir-sterili-75-12540",
    "credit": "meafarma.it"
  },
  "GUANTI STERILI MISURA 8": {
    "src": "https://meafarma.it/image/cache/data/pharmadb/909972756-900x900.jpg",
    "source": "https://meafarma.it/guanti-chir-sterili-75-12540",
    "credit": "meafarma.it"
  },
  "HYALO SILVER SPAY": {
    "src": "https://www.helpnet.ro/data/images/img-large/1/10261.jpg",
    "source": "https://www.helpnet.ro/hyalo-4-silver-spray-125ml",
    "credit": "www.helpnet.ro"
  },
  "INADINE GARZE 9,5X9,5CM": {
    "src": "https://www.alphega.cz/imgserver/eshop/ah/19/2000000325/12587-inadine%209.5%20x%209.5%20cm%2025ks.jpg",
    "source": "https://www.alphega.cz/inadine-9-5-x-9-5-cm-25ks",
    "credit": "www.alphega.cz"
  },
  "IODOPOVIDONE 125 ML": {
    "src": "https://farmaciajimenez.com/storage/products/iodina-solucion-topica-125-ml/iodina-125-ml.jpg",
    "source": "https://farmaciajimenez.com/nuestras-marcas/orravan/iodina-solucion-topica-125-ml",
    "credit": "Fotografia di catalogo"
  },
  "IODOSORB POLVERE BUSTINE 3GR": {
    "src": "https://incontinenceproducts.com.au/cdn/shop/files/Iodosorb-Powder-3g-Sachet_1600x.jpg?v=1730781757",
    "source": "https://incontinenceproducts.com.au/products/iodosorb-powder-3g-sachet-pack-of-7",
    "credit": "incontinenceproducts.com.au"
  },
  "IRUXOL": {
    "src": "https://medtabletka.online/image/cache/catalog/kozha/iruksol30-500x500.jpg",
    "source": "https://medtabletka.online/kozhnye-pokrovy/iruksol-iruxol-30gr-maz",
    "credit": "medtabletka.online"
  },
  "LACCIO EMOSTATICO": {
    "src": "https://cdn.redcare.it/images/IT9/85/941/83/IT908594183-p15.jpg",
    "source": "https://www.redcare.it/benessere/IT908594183/pic-solution-tourniquet-laccio-emostatico-in-lattice.htm",
    "credit": "www.redcare.it"
  },
  "LOMATUELL": {
    "src": "https://paguemenos.vtexassets.com/arquivos/ids/1004660/Cobertura-de-Gaze-Vaselinada-Nao-Aderente-Lomatuell-H-10x10cm-23318---Unidade.jpg?v=638797194799530000",
    "source": "https://www.paguemenos.com.br/cobertura-de-gaze-vaselinada-nao-aderente-lomatuell-h-10x10cm-23318-unidade-174o3rf507441199/p",
    "credit": "www.paguemenos.com.br"
  },
  "MELGISORB AG (ALGINATO CALCIO CON ARGENTO) 10X10CM": {
    "src": "https://www.mapharmacie.be/resize/600x600/media/finish/img/normal/70/melgisorb-ag-10x10cm-256100-10-pc.jpg",
    "source": "https://www.mapharmacie.be/produit/melgisorb-ag-10x10cm-256100-10-pc-5879ea26acedb",
    "credit": "www.mapharmacie.be"
  },
  "MEPILEX AG POLIURETANO ASS. CON ARGENTO 10X10CM": {
    "src": "https://images.e-menessaptieka.lv/unsafe/1200x/a2/d6/9762a21bc7bcdd04a7d431dae114.png",
    "source": "https://e-menessaptieka.lv/en/p/mepilex-ag-10x10-cm-wound-dressing-5-pcs-1132101",
    "credit": "e-menessaptieka.lv"
  },
  "MEPILEX SCHIUMA ASSORBENTE 10X10CM": {
    "src": "https://www.opchealth.com.au/images/thumbs/0002864_mepilex.jpeg",
    "source": "https://www.opchealth.com.au/mepilex",
    "credit": "www.opchealth.com.au"
  },
  "NORUXOL": {
    "src": "https://cdn.redcare.it/images/IT0/280/390/28/IT028039028-p10.jpg",
    "source": "https://www.redcare.it/medicinali/IT028039028/noruxol-collagenasi-unguento-30-g.htm",
    "credit": "www.redcare.it"
  },
  "OSSIDO DI ZINCO DA 1KG": {
    "src": "https://cdn.redcare.it/images/IT9/309/216/55/IT930921655-p13.jpg",
    "source": "https://www.redcare.it/dieta-alimentazione/IT930921655/zinco-ossido-10-unguento-1kg.htm",
    "credit": "Fotografia di catalogo"
  },
  "OSSIDO DI ZINCO TUBETTO 30GR": {
    "src": "https://www.farmacosmo.it/1841596-original_fc/zinco-ossido-10-unguento-lenitivo-30-gr.webp",
    "source": "https://www.farmacosmo.it/cura-e-bellezza-corpo/zinco-ossido-10-unguento-lenitivo-30-g-122211/",
    "credit": "www.farmacosmo.it"
  },
  "PINZETTE STERILI": {
    "src": "https://www.medicalmarket.it/media/catalog/product/1/0/100280r-2-pinzetta-monouso-sterile-plastica-atossica-8cm_1.jpg?height=1000&image-type=image&store=default&width=1000",
    "source": "https://www.medicalmarket.it/pinzetta-per-medicazione-in-plastica-sterile-cm-8-in-conf-singola.html",
    "credit": "www.medicalmarket.it"
  },
  "PROTECT FILM CEROTTO 6X7CM": {
    "src": "https://www.patagonus.cl/cdn/shop/products/aposito-transparente-protect-film-10-x-12-cm-220842.jpg?v=1640793840",
    "source": "https://www.patagonus.cl/products/aposito-transparente-protect-film-10-x-12-cm",
    "credit": "Fotografia di catalogo"
  },
  "PROTECT FILM CEROTTO 10X12CM": {
    "src": "https://www.patagonus.cl/cdn/shop/products/aposito-transparente-protect-film-10-x-12-cm-220842.jpg?v=1640793840",
    "source": "https://www.patagonus.cl/products/aposito-transparente-protect-film-10-x-12-cm",
    "credit": "Fotografia di catalogo"
  },
  "RUBINETTO A 3 VIE": {
    "src": "https://gefmedica.it/cdn/shop/files/fwm-003.jpg?v=1766772993",
    "source": "https://gefmedica.it/products/m-d-threeway-rubinetto-a-3-vie-per-linee-infusionali-sterile",
    "credit": "gefmedica.it"
  },
  "SACCHE URINE CIRCUITO CHIUSO": {
    "src": "https://didactic.care/photos/COLSCS03CRO.png",
    "source": "https://infineed.didactic.care/produit/?REF=COLSCS03CRO&n=collecteur-urine-sterile-systeme-clos-2-litres-valve-antiretour-site-de-prelevement-sans-aiguille-robinet-de-vidange-crochet-integre",
    "credit": "infineed.didactic.care"
  },
  "SET CATETERI VESCICALE*": {
    "src": "https://medicalistore.it/img/p/3/8/7/3/5/7/387357.jpg",
    "source": "https://medicalistore.it/nl/dressingkit/123885-kit-cateterismo-sterile-1-kit.html",
    "credit": "Fotografia di catalogo"
  },
  "SFIGMOMANOMETRO": {
    "src": "https://risorse.doctorshop.it/images/5735/2",
    "source": "https://www.doctorshop.eu/Prodotti/diagnostics-DI/sphygmomanometers-blood-pressure-monitor-DI-8/sirio-sphygmomanometer-aneroid-101529",
    "credit": "www.doctorshop.eu"
  },
  "SIRINGHE DA 5CC": {
    "src": "https://www.worldpharma.it/_img/siringa-monouso.jpg",
    "source": "https://www.worldpharma.it/medicina-estetica/monouso-e-medicazione/aghi/siringa-monouso-5ml-100-pezzi",
    "credit": "Fotografia di catalogo"
  },
  "SIRINGHE DA 10CC": {
    "src": "https://www.worldpharma.it/_img/siringa-monouso.jpg",
    "source": "https://www.worldpharma.it/medicina-estetica/monouso-e-medicazione/aghi/siringa-monouso-5ml-100-pezzi",
    "credit": "Fotografia di catalogo"
  },
  "SIRINGHE DA 20CC": {
    "src": "https://www.worldpharma.it/_img/siringa-monouso.jpg",
    "source": "https://www.worldpharma.it/medicina-estetica/monouso-e-medicazione/aghi/siringa-monouso-5ml-100-pezzi",
    "credit": "Fotografia di catalogo"
  },
  "SODIO CLORURO 10ML": {
    "src": "https://www.medicalaestheticsuppliesaustralia.com.au/cdn/shop/files/PFIZERSodiumChloride.png?v=1709258446&width=690",
    "source": "https://www.medicalaestheticsuppliesaustralia.com.au/products/sodium-chloride-saline-0-9-injection-pfizer-10ml-box-50",
    "credit": "www.medicalaestheticsuppliesaustralia.com.au"
  },
  "SOFARGEN CREMA 50G": {
    "src": "https://borgovetfarma.it/image/cache/catalog/alfasigma/sofargen-1-per-cento-crema-120-grammi-025561073-528x528.jpg",
    "source": "https://borgovetfarma.it/sofargen-crema-1-tubo-grande-120-grammi",
    "credit": "borgovetfarma.it"
  },
  "SOFARGEN CREMA 120G": {
    "src": "https://borgovetfarma.it/image/cache/catalog/alfasigma/sofargen-1-per-cento-crema-120-grammi-025561073-528x528.jpg",
    "source": "https://borgovetfarma.it/sofargen-crema-1-tubo-grande-120-grammi",
    "credit": "borgovetfarma.it"
  },
  "SONDE RETTALI CH 22": {
    "src": "https://catalogo.medicalcenterperugia.it/170-large_default/sonda-rettale-sterile-ch-22-cm-40-diametro-73-mm.jpg",
    "source": "https://catalogo.medicalcenterperugia.it/articoli-sanitari-e-medicazione/211-sonda-rettale-sterile-ch-22-cm-40-diametro-73-mm.html",
    "credit": "Fotografia di catalogo"
  },
  "SONDINO SNG CH 15": {
    "src": "https://d14aq0tikw47l4.cloudfront.net/santaapolonia.com.br/fotos/145800017052020080754.jpg",
    "source": "https://www.santaapolonia.com.br/produtos/sonda-nasogastrica-longa-mark-med-474700",
    "credit": "www.santaapolonia.com.br"
  },
  "STATIVI PER PROVETTE": {
    "src": "https://www.thermofisher.cz/img/70737D726F7C-6B5B5A5A5A5A5A5A5B626070-stojanek-na-zkumavky-pp-12-x-pr-12.jpg",
    "source": "https://www.thermofisher.cz/produkty/stojanek-na-zkumavky-pp-12-x-pr-12",
    "credit": "www.thermofisher.cz"
  },
  "STRISCE PH PER VERIFICA POSIZIONAMENTO SNG": {
    "src": "https://medisa.com.au/cdn/shop/files/32819_source_1708080095.png?v=1723267145",
    "source": "https://medisa.com.au/products/feeding-sets-and-accessories-medicina-enfit-ph-indicator-strips-in01-in02",
    "credit": "medisa.com.au"
  },
  "TAPPINI PER CVP CON MEMBRANA PERFORABILE LUER LOCK": {
    "src": "https://medimall.pl/environment/cache/images/500_500_productGfx_100385/Korki-do-wenflonow-BD-luer-lock-5472.jpg",
    "source": "https://medimall.pl/en_US/p/Luer-lock-cap-BD-WHITE-ref.-TP-100-pcs/3773",
    "credit": "medimall.pl"
  },
  "TELINI STERILI 35X50CM": {
    "src": "https://cdn.redcare.it/images/IT9/065/930/49/IT906593049-p10.jpg",
    "source": "https://www.redcare.it/articoli-sanitari/IT906593049/doc-telo-chirurgico-sterile.htm",
    "credit": "www.redcare.it"
  },
  "TEGADERM FOAM 10X11 ADESIVO (EX TIELLE)": {
    "src": "https://medicalsupermarketcdn.blob.core.windows.net/resources/ProductImages/3ed6f8d2-ab91-4c1c-b557-432cd9aa9086.jpg",
    "source": "https://www.medical-supermarket.com/Product/73640/MED-DRE-358/Tegaderm-Foam-Adhesive-Dressing-10cm-x-11cm",
    "credit": "www.medical-supermarket.com"
  },
  "URGOTUL AG SILVER 10X12CM": {
    "src": "https://parafarmic.com/5796-large_default/urgotul-ag-aposito-con-sal-de-plata.jpg",
    "source": "https://parafarmic.com/urgotul-ag-aposito-con-sal-de-plata",
    "credit": "parafarmic.com"
  },
  "URGOSORB SILVER 10X10CM": {
    "src": "https://www.chemist.net/media/catalog/product/u/r/urgosorb-silver-dressings-10cmx10cm-10s_sp17856.jpg",
    "source": "https://www.chemist.net/urgosorb-silver-dressing-10cm-x-10cm-10s-pd-17218?srsltid=AfmBOopinMh_AgQgUHcaSDdngi5R3YNSBIQZU4-WgRqO7xGToJa8H7mq",
    "credit": "www.chemist.net"
  },
  "VLIWASORB SUPERASS. 10X10, SU PRESCRIZIONE SPECIALISTICA": {
    "src": "https://einhorn-apotheke.at/media/d8/c6/83/1750214261/3617416_vliwasorb-superabsorbierender_wundverband-10x10cm-10st_wm.webp?ts=1776354038",
    "source": "https://einhorn-apotheke.at/Vliwasorb-Superabsorbierender-Wundverband-steril-10-x-10-cm/3617416",
    "credit": "einhorn-apotheke.at"
  },
  "FARMACTIVE SCHIUMA POLIURETANO BORDO ADESIVO 10X10CM": {
    "src": "https://www.talinamed.pt/img/p/2/6/7/6/4/26764.jpg",
    "source": "https://www.talinamed.pt/666farmactive-penso-espuma.html",
    "credit": "Fotografia di catalogo"
  },
  "SCHIZZETTONI CONO CATETERE 50-60ML": {
    "src": "https://apothekeloreto.de/image/cache/data/907144467-735x735.jpg",
    "source": "https://apothekeloreto.de/sterile-einwegspritze-60-ml-konuskatheter-1-spritze",
    "credit": "Fotografia di catalogo"
  },
  "SPUGNETTA PRESAPONATA": {
    "src": "https://www.homecaremedicalsupplies.ie/cdn/shop/files/NATURAL_PRE_SOAPED_FOAM_SPONGE_50PK_ad9589e6-f6bb-483b-87a7-398e8557a2d5.png?v=1751925207",
    "source": "https://www.homecaremedicalsupplies.ie/products/natural-pre-soaped-foam-sponge-50pk",
    "credit": "Fotografia di catalogo"
  }
};
export function productImage(name:string):ProductImage|undefined{return images[name.trim().replace(/\s+/g,' ').toUpperCase()];}
