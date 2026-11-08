// Reviewed product-name matches only. These source photos are illustrative;
// the catalog name and size, not the photo, identify the requested material.
export type ProductImage = {src:string; source:string; credit:string};
const images:Record<string,ProductImage> = {
  'ACTICOAT FLEX 3 10X10, SU PRESCRIZIONE SPECIALISTICA': {
    src:'https://www.marksteypharmacy.co.uk/cdn/shop/products/acticoatflex3.jpg?v=1618296497',
    source:'https://www.marksteypharmacy.co.uk/products/acticoat-flex-3-dressings-different-sizes-uk-pharmacy-seller',
    credit:'Marks Tey Pharmacy · Smith+Nephew',
  },
  'AQUACEL AG+EXTRA 10X10CM': {
    src:'https://digitalassetcdn.net/958477e3-8eb8-4892-882e-b29a00ee8e59.jpg?fit=bounds&format=webp&height=300&quality=85&versionNumber=1&width=300',
    source:'https://www.convatec.com/it-it/prodotti/gestione-avanzata-delle-lesioni/tipologia-di-lesione/pc-lesioni-cutanee-per-tipo-di-lesione-lesioni-da-pressione-di-l-e-ll-stadio/aquacel-ag-extra/',
    credit:'Convatec',
  },
  'PRONTOSAN SOLUZIONE 350ML': {
    src:'https://cdn.shopify.com/s/files/1/0012/8440/7394/files/braun-prontosan-wound-solution-braun-30515210092642.jpg?v=1716460639',
    source:'https://www.medshop.com.au/products/braun-prontosan-wound-solution',
    credit:'Medshop · B. Braun',
  },
  'URGOCLEAN AG': {
    src:'https://urgomedical.it/wp-content/uploads/urgo-clean-ag-pack-01-200x200.jpg',
    source:'https://urgomedical.it/prodotto/active-defense/urgoclean-ag/',
    credit:'Urgo Medical',
  },
};
export function productImage(name:string):ProductImage|undefined {
  return images[name.trim().replace(/\s+/g,' ').toUpperCase()];
}
