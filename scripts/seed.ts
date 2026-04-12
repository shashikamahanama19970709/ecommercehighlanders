import mongoose from 'mongoose';
import Sport from '../src/lib/models/Sport';
import CategorySchema from '../src/lib/models/CategorySchema';
import Brand from '../src/lib/models/Brand';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_ecommerce';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Sport.deleteMany({});
    await CategorySchema.deleteMany({});
    await Brand.deleteMany({});

    // Seed Sports
    const sports = [
      {
        name: 'Cricket',
        equipmentTypes: ['Cricket Bat', 'Cricket Ball', 'Cricket Helmet', 'Cricket Gloves', 'Cricket Pads', 'Cricket Wicket']
      },
      {
        name: 'Football',
        equipmentTypes: ['Football', 'Football Boots', 'Shin Guards', 'Football Gloves', 'Training Cone']
      },
      {
        name: 'Baseball',
        equipmentTypes: ['Baseball Bat', 'Baseball', 'Baseball Glove', 'Baseball Helmet', 'Baseball Cap']
      },
      {
        name: 'Tennis',
        equipmentTypes: ['Tennis Racket', 'Tennis Ball', 'Tennis Shoes', 'Tennis Net']
      },
      {
        name: 'Badminton',
        equipmentTypes: ['Badminton Racket', 'Shuttlecock', 'Badminton Net', 'Badminton Shoes']
      },
      {
        name: 'Hockey',
        equipmentTypes: ['Hockey Stick', 'Hockey Ball', 'Hockey Helmet', 'Hockey Gloves', 'Hockey Pads']
      },
      {
        name: 'MMA',
        equipmentTypes: ['MMA Gloves', 'MMA Shorts', 'Mouth Guard', 'Hand Wraps', 'MMA Helmet']
      },
      {
        name: 'Basketball',
        equipmentTypes: ['Basketball', 'Basketball Shoes', 'Basketball Jersey', 'Basketball Net']
      },
      {
        name: 'Volleyball',
        equipmentTypes: ['Volleyball', 'Volleyball Net', 'Volleyball Shoes']
      },
      {
        name: 'Golf',
        equipmentTypes: ['Golf Club', 'Golf Ball', 'Golf Bag', 'Golf Shoes', 'Golf Glove']
      }
    ];

    await Sport.insertMany(sports);
    console.log('Sports seeded');

    // Seed CategorySchemas
    const schemas = [
      {
        equipmentType: 'Cricket Bat',
        fields: [
          { name: 'willow', label: 'Willow Type', type: 'select', options: ['English', 'Kashmir'], required: true },
          { name: 'weight', label: 'Weight (grams)', type: 'number', required: true },
          { name: 'size', label: 'Size', type: 'select', options: ['Short Handle', 'Long Handle'], required: true }
        ]
      },
      {
        equipmentType: 'Football',
        fields: [
          { name: 'size', label: 'Size', type: 'select', options: ['Size 3', 'Size 4', 'Size 5'], required: true },
          { name: 'material', label: 'Material', type: 'select', options: ['Synthetic', 'Leather'], required: true }
        ]
      },
      {
        equipmentType: 'Baseball Bat',
        fields: [
          { name: 'length', label: 'Length (inches)', type: 'number', required: true },
          { name: 'barrelDiameter', label: 'Barrel Diameter (inches)', type: 'number', required: true },
          { name: 'material', label: 'Material', type: 'select', options: ['Wood', 'Aluminum', 'Composite'], required: true }
        ]
      },
      {
        equipmentType: 'Tennis Racket',
        fields: [
          { name: 'weight', label: 'Weight (grams)', type: 'number', required: true },
          { name: 'headSize', label: 'Head Size (sq in)', type: 'number', required: true },
          { name: 'balance', label: 'Balance', type: 'select', options: ['Head Light', 'Even Balance', 'Head Heavy'], required: true }
        ]
      },
      {
        equipmentType: 'Badminton Racket',
        fields: [
          { name: 'weight', label: 'Weight (grams)', type: 'number', required: true },
          { name: 'balance', label: 'Balance', type: 'select', options: ['Head Light', 'Even Balance', 'Head Heavy'], required: true },
          { name: 'flex', label: 'Flex', type: 'select', options: ['Flexible', 'Medium', 'Stiff'], required: true }
        ]
      },
      {
        equipmentType: 'Hockey Stick',
        fields: [
          { name: 'length', label: 'Length (inches)', type: 'number', required: true },
          { name: 'curve', label: 'Curve', type: 'select', options: ['Low', 'Medium', 'High'], required: true },
          { name: 'material', label: 'Material', type: 'select', options: ['Wood', 'Composite'], required: true }
        ]
      },
      {
        equipmentType: 'MMA Gloves',
        fields: [
          { name: 'weight', label: 'Weight (oz)', type: 'select', options: ['4oz', '6oz', '8oz', '10oz', '12oz', '14oz', '16oz'], required: true },
          { name: 'style', label: 'Style', type: 'select', options: ['Bag Gloves', 'Sparring Gloves', 'Competition Gloves'], required: true }
        ]
      },
      {
        equipmentType: 'Basketball',
        fields: [
          { name: 'size', label: 'Size', type: 'select', options: ['Size 5', 'Size 6', 'Size 7'], required: true },
          { name: 'material', label: 'Material', type: 'select', options: ['Composite Leather', 'Synthetic Leather', 'Rubber'], required: true }
        ]
      },
      {
        equipmentType: 'Golf Club',
        fields: [
          { name: 'type', label: 'Type', type: 'select', options: ['Driver', 'Fairway Wood', 'Hybrid', 'Iron', 'Wedge', 'Putter'], required: true },
          { name: 'loft', label: 'Loft (degrees)', type: 'number', required: true },
          { name: 'material', label: 'Material', type: 'select', options: ['Steel', 'Graphite', 'Titanium'], required: true }
        ]
      }
    ];

    await CategorySchema.insertMany(schemas);
    console.log('Category schemas seeded');

    // Seed Brands
    const brandData = [
      { name: "Nike", sports: ["Football", "Basketball", "Tennis", "Running"], logoUrl: "https://ui-avatars.com/api/?name=Nike&background=000000&color=ffffff&size=100&font-size=0.6" },
      { name: "Adidas", sports: ["Football", "Tennis", "Cricket", "Running"], logoUrl: "https://ui-avatars.com/api/?name=Adidas&background=000000&color=ffffff&size=100&font-size=0.6" },
      { name: "Puma", sports: ["Football", "Basketball", "Running"], logoUrl: "https://ui-avatars.com/api/?name=Puma&background=000000&color=ffffff&size=100&font-size=0.6" },
      { name: "Kookaburra", sports: ["Cricket", "Hockey"], logoUrl: "https://ui-avatars.com/api/?name=Kookaburra&background=000000&color=ffffff&size=100&font-size=0.6" },
      { name: "Rawlings", sports: ["Baseball"], logoUrl: "https://ui-avatars.com/api/?name=Rawlings&background=000000&color=ffffff&size=100&font-size=0.6" },
      { name: "Wilson", sports: ["Tennis", "Basketball", "American Football"], logoUrl: "https://ui-avatars.com/api/?name=Wilson&background=000000&color=ffffff&size=100&font-size=0.6" },
      { name: "Everlast", sports: ["Boxing", "MMA"], logoUrl: "https://ui-avatars.com/api/?name=Everlast&background=000000&color=ffffff&size=100&font-size=0.6" },
      { name: "Yonex", sports: ["Badminton", "Tennis"], logoUrl: "https://ui-avatars.com/api/?name=Yonex&background=000000&color=ffffff&size=100&font-size=0.6" },
      { name: "Gray-Nicolls", sports: ["Cricket"], logoUrl: "https://ui-avatars.com/api/?name=Gray-Nicolls&background=000000&color=ffffff&size=100&font-size=0.6" },
      { name: "New Balance", sports: ["Running", "Basketball", "Football"], logoUrl: "https://ui-avatars.com/api/?name=New+Balance&background=000000&color=ffffff&size=100&font-size=0.6" },
      { name: "Under Armour", sports: ["Football", "Basketball", "Running"], logoUrl: "https://ui-avatars.com/api/?name=Under+Armour&background=000000&color=ffffff&size=100&font-size=0.6" },
      { name: "Reebok", sports: ["Football", "Running", "Basketball"], logoUrl: "https://ui-avatars.com/api/?name=Reebok&background=000000&color=ffffff&size=100&font-size=0.6" }
    ];

    // Get sport IDs for brand associations
    const sportMap = new Map();
    for (const sport of sports) {
      const sportDoc = await Sport.findOne({ name: sport.name });
      if (sportDoc) {
        sportMap.set(sport.name, sportDoc._id);
      }
    }

    const brandsToInsert = brandData.map(brand => ({
      name: brand.name,
      logoUrl: brand.logoUrl, // Keep logoUrl for backward compatibility
      associatedSports: brand.sports.map(sportName => sportMap.get(sportName)).filter(Boolean),
      isPublished: true, // Publish some brands by default
    }));

    await Brand.insertMany(brandsToInsert);
    console.log('Brands seeded');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase();