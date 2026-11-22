// All content lives here. To add a drink, add one line to DRINKS.
// To add an ingredient, add one line to EXTRAS.
// Fields: shots, milk ('steamed' | 'cold'), art ('heart' | 'rosetta' | 'tulip'), extras [ids]
export const EXTRAS = {
  water: 'hot water', ice: 'ice', icecream: 'ice cream', choc: 'chocolate',
  caramel: 'caramel', vanilla: 'vanilla', pumpkin: 'pumpkin spice', whip: 'whipped cream'
};

export const DRINKS = [
  { id: 'espresso', name: 'Espresso', shots: 1 },
  { id: 'doppio', name: 'Doppio', shots: 2 },
  { id: 'americano', name: 'Americano', shots: 1, extras: ['water'] },
  { id: 'cortado', name: 'Cortado', shots: 2, milk: 'steamed' },
  { id: 'macchiato', name: 'Espresso macchiato', shots: 1, milk: 'steamed' },
  { id: 'cappuccino', name: 'Cappuccino', shots: 2, milk: 'steamed', art: 'rosetta' },
  { id: 'latte', name: 'Latte', shots: 1, milk: 'steamed', art: 'heart' },
  { id: 'flatwhite', name: 'Flat white', shots: 2, milk: 'steamed', art: 'tulip' },
  { id: 'mocha', name: 'Mocha', shots: 1, milk: 'steamed', art: 'heart', extras: ['choc'] },
  { id: 'carmac', name: 'Caramel macchiato', shots: 1, milk: 'steamed', extras: ['vanilla', 'caramel'] },
  { id: 'psl', name: 'Pumpkin spice latte', shots: 1, milk: 'steamed', extras: ['pumpkin', 'whip'] },
  { id: 'icedlatte', name: 'Iced latte', shots: 1, milk: 'cold', extras: ['ice'] },
  { id: 'icedvanilla', name: 'Iced vanilla latte', shots: 1, milk: 'cold', extras: ['ice', 'vanilla'] },
  { id: 'affogato', name: 'Affogato', shots: 1, extras: ['icecream'] },
  { id: 'affcaramel', name: 'Caramel affogato', shots: 1, extras: ['icecream', 'caramel'] }
];
