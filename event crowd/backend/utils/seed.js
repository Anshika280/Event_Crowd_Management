import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eventcrowd');

    // Clear existing data
    await User.deleteMany();
    await Event.deleteMany();
    await Registration.deleteMany();

    console.log('Database cleared.');

    // Create Admin
    const adminUser = await User.create({
      name: 'Crowd Admin',
      email: 'admin@crowd.com',
      password: 'admin123',
      role: 'admin',
    });

    // Create User
    const standardUser = await User.create({
      name: 'Udit Sharma',
      email: 'user@crowd.com',
      password: 'user123',
      role: 'user',
    });

    console.log('Users seeded successfully.');

    // Create Events
    const events = [
      {
        title: 'Global Tech Summit 2026',
        description: 'Explore the next wave of agentic AI, Web3, and quantum computing. A premier gathering for builders and developers worldwide.',
        date: new Date('2026-09-15T09:00:00'),
        time: '09:00 AM - 05:00 PM',
        venue: 'Silicon Valley Convention Center, Hall A',
        capacityLimit: 120,
        currentCount: 0,
        category: 'Tech',
        price: 1500,
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
      },
      {
        title: 'Tomorrowland Beats Festival',
        description: 'Experience the ultimate electronic music festival featuring world-class DJs, immersive visual installations, and a vibrant crowd.',
        date: new Date('2026-08-20T17:00:00'),
        time: '05:00 PM - 11:30 PM',
        venue: 'Neon Sands Arena',
        capacityLimit: 5, // Small capacity to easily test capacity-exhaustion flows
        currentCount: 0,
        category: 'Music',
        price: 2500,
        bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60',
      },
      {
        title: 'Avant-Garde Art Exhibition',
        description: 'A curated showcase of contemporary visual art, interactive light galleries, and augmented reality canvases from local and global creators.',
        date: new Date('2026-10-05T10:00:00'),
        time: '10:00 AM - 06:00 PM',
        venue: 'Metropolitan Museum of Design',
        capacityLimit: 50,
        currentCount: 0,
        category: 'Arts',
        price: 0,
        bannerUrl: 'https://images.unsplash.com/photo-1531058020387-3be344559be6?w=800&auto=format&fit=crop&q=60',
      },
      {
        title: 'Culinary Masterclass & Tasting',
        description: 'Indulge in a premium gastronomic journey. Live cooking demonstrations by Michelin-star chefs followed by exclusive food and wine tastings.',
        date: new Date('2026-11-12T12:00:00'),
        time: '12:00 PM - 03:00 PM',
        venue: 'The Grand Lounge & Gardens',
        capacityLimit: 30,
        currentCount: 0,
        category: 'Food',
        price: 1200,
        bannerUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=60',
      },
    ];

    const eventsWithCreator = events.map(evt => ({
      ...evt,
      createdBy: adminUser._id
    }));

    const seededEvents = await Event.insertMany(eventsWithCreator);
    console.log('Events seeded successfully.');

    // Seed a couple of default registrations to make charts look nice
    const ticketCode1 = 'CROWD-TECH-SUMMIT';
    const ticketCode2 = 'CROWD-TML-BEATS';

    const reg1 = await Registration.create({
      user: standardUser._id,
      event: seededEvents[0]._id, // Tech Summit
      ticketCode: ticketCode1,
      checkedIn: true,
      checkInTime: new Date(Date.now() - 3600000 * 2), // Checked in 2 hours ago
    });

    const reg2 = await Registration.create({
      user: standardUser._id,
      event: seededEvents[1]._id, // Beats Festival
      ticketCode: ticketCode2,
      checkedIn: false,
    });

    // Update current count for the first event
    seededEvents[0].currentCount = 1;
    await seededEvents[0].save();

    console.log('Sample registrations seeded.');
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
