// Optional sample data:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopping_cart');
  await Promise.all([Category.deleteMany({}), Product.deleteMany({})]);

  const tree = {
    Electronics: ['Mobiles', 'Laptops'],
    Fashion: ['Men', 'Women'],
    'Home & Kitchen': ['Cookware', 'Furniture']
  };
  const subs = {};
  for (const [parentName, children] of Object.entries(tree)) {
    const parent = await Category.create({ name: parentName });
    for (const c of children) subs[c] = (await Category.create({ name: c, parent: parent._id }))._id;
  }

  const img = (t) => `https://placehold.co/400x300?text=${encodeURIComponent(t)}`;
  await Product.insertMany([
    { name: 'Smartphone X', description: '6.5" display, 128GB', price: 15999, stock: 20, category: subs.Mobiles, imageUrl: img('Smartphone X') },
    { name: 'Budget Phone', description: '5000mAh battery', price: 8999, stock: 35, category: subs.Mobiles, imageUrl: img('Budget Phone') },
    { name: 'Laptop Pro 14', description: '16GB RAM, 512GB SSD', price: 58999, stock: 8, category: subs.Laptops, imageUrl: img('Laptop Pro 14') },
    { name: 'Cotton T-Shirt', description: 'Regular fit', price: 499, stock: 100, category: subs.Men, imageUrl: img('Cotton T-Shirt') },
    { name: 'Floral Kurti', description: 'Soft cotton', price: 799, stock: 60, category: subs.Women, imageUrl: img('Floral Kurti') },
    { name: 'Non-stick Pan', description: '24cm', price: 649, stock: 40, category: subs.Cookware, imageUrl: img('Non-stick Pan') },
    { name: 'Study Table', description: 'Engineered wood', price: 3499, stock: 12, category: subs.Furniture, imageUrl: img('Study Table') }
  ]);

  console.log('Sample categories and products created.');
  await mongoose.disconnect();
})();
