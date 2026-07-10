

module.exports = [
  {
    name: 'Jollof Rice',
    description: 'Smoky party-style jollof rice',
    category: 'Rice',
    price: 250000, // ₦2,500
    options: [
      {
        name: 'Protein',
        choices: [
          { label: 'Chicken', priceDelta: 0 },
          { label: 'Beef', priceDelta: 0 },
          { label: 'Fish', priceDelta: 50000 },
          { label: 'No protein', priceDelta: -50000 },
        ],
      },
      {
        name: 'Spice Level',
        choices: [
          { label: 'Mild', priceDelta: 0 },
          { label: 'Hot', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    name: 'Fried Rice',
    description: 'Vegetable-loaded fried rice',
    category: 'Rice',
    price: 250000,
    options: [
      {
        name: 'Protein',
        choices: [
          { label: 'Chicken', priceDelta: 0 },
          { label: 'Beef', priceDelta: 0 },
          { label: 'Fish', priceDelta: 50000 },
        ],
      },
    ],
  },
  {
    name: 'Pounded Yam & Egusi',
    description: 'Served with assorted meat',
    category: 'Swallow',
    price: 350000,
    options: [
      {
        name: 'Meat Type',
        choices: [
          { label: 'Beef', priceDelta: 0 },
          { label: 'Goat Meat', priceDelta: 30000 },
          { label: 'Assorted', priceDelta: 50000 },
        ],
      },
    ],
  },
  {
    name: 'Suya',
    description: 'Grilled spicy skewered beef',
    category: 'Grill',
    price: 150000,
    options: [
      {
        name: 'Size',
        choices: [
          { label: 'Regular (10 sticks)', priceDelta: 0 },
          { label: 'Large (20 sticks)', priceDelta: 120000 },
        ],
      },
    ],
  },
  {
    name: 'Chapman',
    description: 'Classic Nigerian mocktail',
    category: 'Drinks',
    price: 80000,
    options: null,
  },
  {
    name: 'Zobo',
    description: 'Chilled hibiscus drink',
    category: 'Drinks',
    price: 60000,
    options: null,
  },
];