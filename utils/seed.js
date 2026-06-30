require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Post = require('../models/Post');

const run = async () => {
  await connectDB();

  await User.deleteMany({});
  await Post.deleteMany({});

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@inkwell.test',
    password: 'Password123',
    role: 'admin',
    bio: 'Editor-in-chief at Inkwell.'
  });

  const writer = await User.create({
    name: 'Asha Mehta',
    email: 'asha@inkwell.test',
    password: 'Password123',
    role: 'user',
    bio: 'Writes about productivity, design and slow living.'
  });

  const samplePosts = [
    {
      title: 'Why Slow Mornings Make Better Days',
      excerpt: 'A short case for protecting the first hour of your day from notifications.',
      content:
        'There is a particular kind of clarity that only shows up before the world wakes up. ' +
        'This post walks through a simple, low-effort morning routine that protects focus without ' +
        'requiring you to wake up at 5am or buy anything new.',
      category: 'Lifestyle',
      tags: ['mornings', 'focus', 'habits'],
      status: 'published',
      author: writer._id
    },
    {
      title: 'A Practical Guide to Note-Taking Systems',
      excerpt: 'Zettelkasten, PARA, or a plain notebook — what actually matters is consistency.',
      content:
        'Most note-taking systems fail not because of the system, but because of the friction ' +
        'around capturing a thought in the moment. This guide compares three popular approaches ' +
        'and gives you a one-page checklist to pick the one that fits your workflow.',
      category: 'Productivity',
      tags: ['notes', 'systems', 'workflow'],
      status: 'published',
      author: admin._id
    },
    {
      title: 'Designing Interfaces People Actually Enjoy',
      excerpt: 'Small, considered details separate forgettable software from beloved software.',
      content:
        'Good interface design rarely announces itself. It shows up in the spacing that lets text ' +
        'breathe, the empty state that tells you what to do next, and the error message that does ' +
        'not blame you. This article breaks down five details worth sweating over.',
      category: 'Design',
      tags: ['ui', 'ux', 'craft'],
      status: 'published',
      author: writer._id
    },
    {
      title: 'Draft: Notes on Building in Public',
      excerpt: 'An unfinished reflection on sharing work before it is ready.',
      content: 'This is a draft post used to demonstrate the draft/published workflow in the dashboard.',
      category: 'Writing',
      tags: ['draft'],
      status: 'draft',
      author: admin._id
    }
  ];

  for (const data of samplePosts) {
    await Post.create(data);
  }

  console.log('Seed complete.');
  console.log('Admin login -> email: admin@inkwell.test | password: Password123');
  console.log('User login  -> email: asha@inkwell.test  | password: Password123');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
