import dbConnect from './mongodb';
import Table from '../models/Table';
import MenuCategory from '../models/MenuCategory';
import MenuItem from '../models/MenuItem';
import Offer from '../models/Offer';

export async function seedDatabase() {
  try {
    await dbConnect();

    // 1. Seed Tables
    const tablesCount = await Table.countDocuments();
    if (tablesCount === 0) {
      console.log('Seeding tables...');
      const tables = Array.from({ length: 12 }, (_, i) => ({
        table_number: i + 1,
        status: 'free'
      }));
      await Table.insertMany(tables);
      console.log('Successfully seeded 12 tables.');
    }

    // 2. Clear old categories and menu items to do a clean update
    console.log('Clearing old categories and items...');
    await MenuCategory.deleteMany({});
    await MenuItem.deleteMany({});

    console.log('Seeding categories and menu items...');
    
    const categories = [
      { name: 'COLD COFFEE', sort_order: 1 },
      { name: 'HOT COFFEE', sort_order: 2 },
      { name: 'ICED COFFEE', sort_order: 3 },
      { name: 'MAGGIE', sort_order: 4 },
      { name: 'TOAST', sort_order: 5 },
      { name: 'GARLIC BREAD', sort_order: 6 },
      { name: 'PIZZA', sort_order: 7 },
      { name: 'SPECIAL PIZZA', sort_order: 8 },
      { name: 'BURGER', sort_order: 9 },
      { name: 'CLASSIC SANDWICH', sort_order: 10 },
      { name: 'GRILLED SANDWICH', sort_order: 11 },
      { name: 'PASTA', sort_order: 12 },
      { name: 'NUGGETS', sort_order: 13 },
      { name: 'MOMOS', sort_order: 14 },
      { name: 'FRIES', sort_order: 15 },
      { name: 'SHAKES', sort_order: 16 },
      { name: 'MOCKTAILS', sort_order: 17 },
      { name: 'CHOCOLATE SHOT', sort_order: 18 },
      { name: 'BROWNIE', sort_order: 19 }
    ];

    const insertedCats = await MenuCategory.insertMany(categories);
    const getCatId = (name: string) => insertedCats.find(c => c.name === name)?._id;

    const menuItems = [
      // COLD COFFEE
      { category_id: getCatId('COLD COFFEE'), name: 'NORMAL COLD COFFEE', description: '', price: 50, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('COLD COFFEE'), name: 'STRONG COLD COFFEE', description: '', price: 60, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('COLD COFFEE'), name: 'COLD COFFEE WITH CRUSH', description: '', price: 70, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('COLD COFFEE'), name: 'THIK WHITE COCO WITH CRUSH', description: '', price: 90, is_veg: true, is_available: true, sort_order: 4 },
      { category_id: getCatId('COLD COFFEE'), name: 'THIK WHITE COCO WITH THUNDER', description: '', price: 90, is_veg: true, is_available: true, sort_order: 5 },
      { category_id: getCatId('COLD COFFEE'), name: 'CAD - B', description: '', price: 100, is_veg: true, is_available: true, sort_order: 6 },
      
      // HOT COFFEE
      { category_id: getCatId('HOT COFFEE'), name: 'HOT COFFE', description: '', price: 25, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('HOT COFFEE'), name: 'REGULAR TEA', description: '', price: 20, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('HOT COFFEE'), name: 'HOT CHOCOLETE', description: '', price: 40, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('HOT COFFEE'), name: 'VANILLA HOT CHOCOLETE', description: '', price: 40, is_veg: true, is_available: true, sort_order: 4 },
      { category_id: getCatId('HOT COFFEE'), name: 'CREAMY HOT COFFE', description: '', price: 50, is_veg: true, is_available: true, sort_order: 5 },
      { category_id: getCatId('HOT COFFEE'), name: 'HEASULNUT', description: '', price: 60, is_veg: true, is_available: true, sort_order: 6 },
      
      // ICED COFFEE
      { category_id: getCatId('ICED COFFEE'), name: 'ICED COFFE', description: '', price: 70, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('ICED COFFEE'), name: 'FRAPPUCCION', description: '', price: 100, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('ICED COFFEE'), name: 'ICED MACHA', description: '', price: 100, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('ICED COFFEE'), name: 'COFFE FREAKSHAKE', description: '', price: 100, is_veg: true, is_available: true, sort_order: 4 },
      { category_id: getCatId('ICED COFFEE'), name: 'DALGONA', description: '', price: 80, is_veg: true, is_available: true, sort_order: 5 },
      
      // MAGGIE
      { category_id: getCatId('MAGGIE'), name: 'PLAIN MAGGIE', description: '', price: 60, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('MAGGIE'), name: 'MASALA MAGGIE', description: '', price: 70, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('MAGGIE'), name: 'SPL. VEG MAGGIE', description: '', price: 90, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('MAGGIE'), name: 'PERI PERI MAGGIE', description: '', price: 90, is_veg: true, is_available: true, sort_order: 4 },
      { category_id: getCatId('MAGGIE'), name: 'TANDOOR MAGGIE', description: '', price: 90, is_veg: true, is_available: true, sort_order: 5 },
      
      // TOAST
      { category_id: getCatId('TOAST'), name: 'MASALA GARLIC TOAST', description: '', price: 60, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('TOAST'), name: 'CHEESE GARLIC TOAST', description: '', price: 80, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('TOAST'), name: 'CHEESE CORN TOAST', description: '', price: 90, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('TOAST'), name: 'CHEESE CHILLY TOAST', description: '', price: 90, is_veg: true, is_available: true, sort_order: 4 },
      { category_id: getCatId('TOAST'), name: 'VEG. GARLIC TOAST', description: '', price: 90, is_veg: true, is_available: true, sort_order: 5 },
      
      // GARLIC BREAD
      { category_id: getCatId('GARLIC BREAD'), name: 'GARLIC BREAD', description: '', price: 90, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('GARLIC BREAD'), name: 'PERI PERI GARLIC BREAD', description: '', price: 110, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('GARLIC BREAD'), name: 'MUFF', description: '', price: 100, is_veg: true, is_available: true, sort_order: 3 },
      
      // PIZZA
      { category_id: getCatId('PIZZA'), name: 'CHEESY MARGEIRATA PIZZA (8")', description: '', price: 110, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('PIZZA'), name: 'CHEESY MARGEIRATA PIZZA (C.B)', description: 'Cheese Burst', price: 130, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('PIZZA'), name: 'CHEESY CORN PIZZA (8")', description: '', price: 130, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('PIZZA'), name: 'CHEESY CORN PIZZA (C.B)', description: 'Cheese Burst', price: 150, is_veg: true, is_available: true, sort_order: 4 },
      { category_id: getCatId('PIZZA'), name: 'MIX VEG. PIZZA (8")', description: '', price: 140, is_veg: true, is_available: true, sort_order: 5 },
      { category_id: getCatId('PIZZA'), name: 'MIX VEG. PIZZA (C.B)', description: 'Cheese Burst', price: 160, is_veg: true, is_available: true, sort_order: 6 },
      { category_id: getCatId('PIZZA'), name: 'TANDOORI PANEER CHEESY PIZZA (8")', description: '', price: 160, is_veg: true, is_available: true, sort_order: 7 },
      { category_id: getCatId('PIZZA'), name: 'TANDOORI PANEER CHEESY PIZZA (C.B)', description: 'Cheese Burst', price: 180, is_veg: true, is_available: true, sort_order: 8 },
      { category_id: getCatId('PIZZA'), name: 'PANEER TIKKA PIZZA (8")', description: '', price: 160, is_veg: true, is_available: true, sort_order: 9 },
      { category_id: getCatId('PIZZA'), name: 'PANEER TIKKA PIZZA (C.B)', description: 'Cheese Burst', price: 180, is_veg: true, is_available: true, sort_order: 10 },
      { category_id: getCatId('PIZZA'), name: 'PERI PERI PANEER PIZZA(PP) (8")', description: '', price: 150, is_veg: true, is_available: true, sort_order: 11 },
      { category_id: getCatId('PIZZA'), name: 'PERI PERI PANEER PIZZA(PP) (C.B)', description: 'Cheese Burst', price: 170, is_veg: true, is_available: true, sort_order: 12 },
      { category_id: getCatId('PIZZA'), name: 'SCHEZWAN CHEESY PIZZA (8")', description: '', price: 150, is_veg: true, is_available: true, sort_order: 13 },
      { category_id: getCatId('PIZZA'), name: 'SCHEZWAN CHEESY PIZZA (C.B)', description: 'Cheese Burst', price: 170, is_veg: true, is_available: true, sort_order: 14 },
      { category_id: getCatId('PIZZA'), name: 'CHEESE BURST PIZZA (8")', description: '', price: 180, is_veg: true, is_available: true, sort_order: 15 },
      { category_id: getCatId('PIZZA'), name: 'CHEESE BURST PIZZA (C.B)', description: 'Cheese Burst', price: 190, is_veg: true, is_available: true, sort_order: 16 },
      
      // SPECIAL PIZZA
      { category_id: getCatId('SPECIAL PIZZA'), name: 'NATURALEZA SPL. PIZZA', description: '', price: 200, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('SPECIAL PIZZA'), name: 'TWO DECKER PIZZA', description: '', price: 220, is_veg: true, is_available: true, sort_order: 2 },
      
      // BURGER
      { category_id: getCatId('BURGER'), name: 'ALOO TIKKI BURGER', description: '', price: 70, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('BURGER'), name: 'VEG. BURGER', description: '', price: 70, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('BURGER'), name: 'SCHEZWAN BURGER', description: '', price: 80, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('BURGER'), name: 'VEG. CHEESE BURGER', description: '', price: 90, is_veg: true, is_available: true, sort_order: 4 },
      { category_id: getCatId('BURGER'), name: 'SIZZLING BURGER', description: '', price: 110, is_veg: true, is_available: true, sort_order: 5 },
      { category_id: getCatId('BURGER'), name: 'CORN CHEESE BURGER', description: '', price: 100, is_veg: true, is_available: true, sort_order: 6 },
      { category_id: getCatId('BURGER'), name: 'PANEER CHEESE BURGER', description: '', price: 100, is_veg: true, is_available: true, sort_order: 7 },
      { category_id: getCatId('BURGER'), name: 'SPL. NATURALEZA BURGER', description: '', price: 130, is_veg: true, is_available: true, sort_order: 8 },
      { category_id: getCatId('BURGER'), name: 'VEG. GRILLED BURGER', description: '', price: 100, is_veg: true, is_available: true, sort_order: 9 },
      
      // CLASSIC SANDWICH
      { category_id: getCatId('CLASSIC SANDWICH'), name: 'BREAD BUTTER SANDWICH', description: '', price: 30, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('CLASSIC SANDWICH'), name: 'VEG SANDWICH', description: '', price: 50, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('CLASSIC SANDWICH'), name: 'CHOCOLATE SANDWICH', description: '', price: 60, is_veg: true, is_available: true, sort_order: 3 },
      
      // GRILLED SANDWICH
      { category_id: getCatId('GRILLED SANDWICH'), name: 'CHOCOLATE GRILLED SANDWICH', description: '', price: 80, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('GRILLED SANDWICH'), name: 'SHEZWEN GRILLED SANDWICH', description: '', price: 80, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('GRILLED SANDWICH'), name: 'BOMBAY GRILLED SANDWICH', description: '', price: 90, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('GRILLED SANDWICH'), name: 'VEG. MAYO GRILLED SANDWICH', description: '', price: 90, is_veg: true, is_available: true, sort_order: 4 },
      { category_id: getCatId('GRILLED SANDWICH'), name: 'VEG. CORN GRILLED SANDWICH', description: '', price: 100, is_veg: true, is_available: true, sort_order: 5 },
      { category_id: getCatId('GRILLED SANDWICH'), name: 'TANDOORI PANEER CHEESE GRILL', description: '', price: 100, is_veg: true, is_available: true, sort_order: 6 },
      { category_id: getCatId('GRILLED SANDWICH'), name: 'PANEER TIKKA CHEESE GRILL', description: '', price: 100, is_veg: true, is_available: true, sort_order: 7 },
      { category_id: getCatId('GRILLED SANDWICH'), name: 'CHEESE BURST SANDWICH GRILL', description: '', price: 100, is_veg: true, is_available: true, sort_order: 8 },
      
      // PASTA
      { category_id: getCatId('PASTA'), name: 'WHITE SAUCE PASTA', description: '', price: 110, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('PASTA'), name: 'RED SOUCE PASTA', description: '', price: 100, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('PASTA'), name: 'PINK PASTA', description: '', price: 120, is_veg: true, is_available: true, sort_order: 3 },
      
      // NUGGETS
      { category_id: getCatId('NUGGETS'), name: 'VEG. FINGER NUGGETS', description: '', price: 90, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('NUGGETS'), name: 'POTATO SHOTS NUGGETS', description: '', price: 70, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('NUGGETS'), name: 'GARLIC SHOTS NUGGETS', description: '', price: 70, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('NUGGETS'), name: 'CHEESE CORN NUGGETS', description: '', price: 80, is_veg: true, is_available: true, sort_order: 4 },
      
      // MOMOS
      { category_id: getCatId('MOMOS'), name: 'MIX VEG. MOMOS', description: '', price: 80, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('MOMOS'), name: 'CHEESE CORN MOMOS', description: '', price: 80, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('MOMOS'), name: 'PANEER MOMOS', description: '', price: 90, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('MOMOS'), name: 'SCHEZWAN MOMOS', description: '', price: 80, is_veg: true, is_available: true, sort_order: 4 },
      
      // FRIES
      { category_id: getCatId('FRIES'), name: 'SALTED FRIES', description: '', price: 70, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('FRIES'), name: 'MASALA FRIES', description: '', price: 80, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('FRIES'), name: 'PERI - PERI FRIES', description: '', price: 80, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('FRIES'), name: 'CHEESE FRIES', description: '', price: 90, is_veg: true, is_available: true, sort_order: 4 },
      { category_id: getCatId('FRIES'), name: 'MAYO FRIES', description: '', price: 90, is_veg: true, is_available: true, sort_order: 5 },
      { category_id: getCatId('FRIES'), name: 'TANDOOR FRIES', description: '', price: 90, is_veg: true, is_available: true, sort_order: 6 },
      
      // SHAKES
      { category_id: getCatId('SHAKES'), name: 'PINEAPPLE SHAKE', description: '', price: 70, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('SHAKES'), name: 'CHOCOLETE SHAKE', description: '', price: 70, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('SHAKES'), name: 'STRAWBERRY SHAKE', description: '', price: 80, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('SHAKES'), name: 'MANGO SHAKE', description: '', price: 70, is_veg: true, is_available: true, sort_order: 4 },
      { category_id: getCatId('SHAKES'), name: 'BUTTERSCOTCH SHAKE', description: '', price: 80, is_veg: true, is_available: true, sort_order: 5 },
      { category_id: getCatId('SHAKES'), name: 'OREO SHAKE', description: '', price: 90, is_veg: true, is_available: true, sort_order: 6 },
      { category_id: getCatId('SHAKES'), name: 'KIT - KAT SHAKE', description: '', price: 90, is_veg: true, is_available: true, sort_order: 7 },
      
      // MOCKTAILS
      { category_id: getCatId('MOCKTAILS'), name: 'CLASSIC MOJITO', description: '', price: 80, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('MOCKTAILS'), name: 'BLUE CURACAO', description: '', price: 80, is_veg: true, is_available: true, sort_order: 2 },
      { category_id: getCatId('MOCKTAILS'), name: 'LEMON MINT', description: '', price: 80, is_veg: true, is_available: true, sort_order: 3 },
      { category_id: getCatId('MOCKTAILS'), name: 'GREEN APPLE', description: '', price: 80, is_veg: true, is_available: true, sort_order: 4 },
      { category_id: getCatId('MOCKTAILS'), name: 'BLACK CURRENT', description: '', price: 80, is_veg: true, is_available: true, sort_order: 5 },
      
      // CHOCOLATE SHOT
      { category_id: getCatId('CHOCOLATE SHOT'), name: 'CHOCOLATE SHOT', description: '', price: 50, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('CHOCOLATE SHOT'), name: 'DARK CHOCOLATE SHOT', description: '', price: 60, is_veg: true, is_available: true, sort_order: 2 },
      
      // BROWNIE
      { category_id: getCatId('BROWNIE'), name: 'CHOCO LAVA CAKE', description: '', price: 80, is_veg: true, is_available: true, sort_order: 1 },
      { category_id: getCatId('BROWNIE'), name: 'BROWNIE DELIGHT', description: '', price: 100, is_veg: true, is_available: true, sort_order: 2 },
    ];

    await MenuItem.insertMany(menuItems);
    console.log('Successfully seeded categories and menu items.');

    // 3. Seed Offer if none exists
    const offersCount = await Offer.countDocuments();
    if (offersCount === 0) {
      console.log('Seeding default offer...');
      await Offer.create({
        title: 'Combo Offer',
        description: 'Burger + Fries + Cold Coffee',
        badge: 'Popular',
        price: 199,
        image_url: 'https://images.unsplash.com/photo-1594212585093-6113b2c15982'
      });
    }

  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}
