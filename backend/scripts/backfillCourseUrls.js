// scripts/backfillCourseUrls.js — run once: node scripts/backfillCourseUrls.js
// Fixes existing seeded courses that were inserted before courseUrl existed
// on the schema. createMany({ skipDuplicates: true }) never updates existing
// rows, so re-running the seed alone does not apply this fix.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const URL_MAP = {
  'React Mastery': 'https://www.udemy.com/courses/search/?q=react',
  'Node.js & APIs': 'https://www.coursera.org/search?query=node.js',
  'Python for Data Science': 'https://www.edx.org/search?q=python%20data%20science',
  'AWS Cloud Fundamentals': 'https://skillbuilder.aws/',
  'UI/UX Design Principles': 'https://www.figma.com/academy/',
  'TypeScript Deep Dive': 'https://frontendmasters.com/courses/typescript-v4/',
};

async function run() {
  for (const [title, courseUrl] of Object.entries(URL_MAP)) {
    const result = await prisma.course.updateMany({
      where: { title },
      data: { courseUrl },
    });
    console.log(`${title}: updated ${result.count} row(s)`);
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });