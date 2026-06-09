// npx prisma db seed
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  const hash = (pw) => bcrypt.hashSync(pw, 12);

  // Admin credentials from env (with fallbacks for local dev)
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@skillhub.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  console.log('📝 Creating users...');
  
  // Users
  const student = await prisma.user.upsert({
    where: { email: 'student@skillhub.com' },
    update: {},
    create: {
      email: 'student@skillhub.com',
      password: hash('Password123!'),
      firstName: 'Alex', 
      lastName: 'Johnson',
      role: 'student',
      avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=4f46e5&color=fff&bold=true',
      title: 'Full Stack Developer',
      bio: 'Passionate developer with 2 years of experience.',
      location: 'Lagos, Nigeria',
      meritCoins: 1250,
      verified: true,
    },
  });

  const employer = await prisma.user.upsert({
    where: { email: 'employer@skillhub.com' },
    update: {},
    create: {
      email: 'employer@skillhub.com',
      password: hash('Password123!'),
      firstName: 'Sarah', 
      lastName: 'Williams',
      role: 'employer',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Williams&background=10b981&color=fff&bold=true',
      company: 'TechVision Africa',
      title: 'HR Manager',
      location: 'Abuja, Nigeria',
      meritCoins: 500,
      verified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email:     adminEmail,
      password:  hash(adminPassword),
      firstName: 'Admin', 
      lastName: 'User',
      role:      'admin',
      avatar:    'https://ui-avatars.com/api/?name=Admin+User&background=ef4444&color=fff&bold=true',
      title:     'Platform Administrator',
      verified:  true,
    },
  });

  console.log(`✅ Users created: student (${student.id}), employer (${employer.id}), admin (${admin.email})`);

  // Courses
  console.log('📚 Creating courses...');
  
  const courses = [
    { title: 'React Mastery', provider: 'Udemy', category: 'Frontend', level: 'Intermediate', duration: '40h', rating: 4.8, enrollCount: 15420, thumbnail: 'https://placehold.co/320x180/4f46e5/white?text=React' },
    { title: 'Node.js & APIs', provider: 'Coursera', category: 'Backend', level: 'Beginner', duration: '30h', rating: 4.7, enrollCount: 9830, thumbnail: 'https://placehold.co/320x180/10b981/white?text=Node.js' },
    { title: 'Python for Data Science', provider: 'edX', category: 'Data', level: 'Beginner', duration: '50h', rating: 4.9, enrollCount: 23100, thumbnail: 'https://placehold.co/320x180/f59e0b/white?text=Python' },
    { title: 'AWS Cloud Fundamentals', provider: 'AWS', category: 'Cloud', level: 'Beginner', duration: '25h', rating: 4.6, enrollCount: 11200, thumbnail: 'https://placehold.co/320x180/ef4444/white?text=AWS' },
    { title: 'UI/UX Design Principles', provider: 'Figma Academy', category: 'Design', level: 'Beginner', duration: '20h', rating: 4.7, enrollCount: 7500, thumbnail: 'https://placehold.co/320x180/8b5cf6/white?text=UI%2FUX' },
    { title: 'TypeScript Deep Dive', provider: 'Frontend Masters', category: 'Frontend', level: 'Advanced', duration: '35h', rating: 4.9, enrollCount: 5400, isPremium: true, price: 5000, thumbnail: 'https://placehold.co/320x180/06b6d4/white?text=TypeScript' },
  ];

  // Use createMany for better performance
  const createdCourses = await prisma.course.createMany({
    data: courses,
    skipDuplicates: true,
  });
  
  console.log(`✅ Created ${createdCourses.count} courses`);

  // Fetch the created courses for relationships
  const allCourses = await prisma.course.findMany();
  
  // Enroll student in first two courses
  console.log('📝 Enrolling student in courses...');
  
  for (const course of allCourses.slice(0, 2)) {
    await prisma.enrollment.upsert({
      where: { 
        userId_courseId: { 
          userId: student.id, 
          courseId: course.id 
        } 
      },
      update: {},
      create: { 
        userId: student.id, 
        courseId: course.id, 
        progress: course.title.includes('React') ? 65 : 30 
      },
    });
  }
  
  console.log('✅ Student enrolled in courses');

  // Jobs
  console.log('💼 Creating jobs...');
  
  const jobs = [
    { title: 'Frontend Developer', company: 'TechVision Africa', location: 'Lagos', type: 'Full-time', salary: '₦400k–₦600k', skills: ['React', 'JavaScript', 'CSS'], description: 'Build modern, responsive web applications for our growing SaaS platform.' },
    { title: 'Backend Engineer', company: 'Paystack', location: 'Remote', type: 'Full-time', salary: '$2,500–$4,000/mo', skills: ['Node.js', 'Python', 'PostgreSQL'], description: 'Design and maintain scalable APIs powering Africa\'s leading payment platform.' },
    { title: 'Data Analyst', company: 'Andela', location: 'Remote', type: 'Contract', salary: '$1,800–$2,800/mo', skills: ['Python', 'SQL', 'Tableau'], description: 'Transform raw data into actionable insights for engineering teams globally.' },
    { title: 'DevOps Engineer', company: 'Flutterwave', location: 'Lagos', type: 'Full-time', salary: '₦700k–₦1M', skills: ['AWS', 'Docker', 'CI/CD'], description: 'Maintain cloud infrastructure supporting 10M+ transactions monthly.' },
    { title: 'UI/UX Designer', company: 'Interswitch', location: 'Lagos', type: 'Full-time', salary: '₦350k–₦500k', skills: ['Figma', 'Adobe XD', 'Research'], description: 'Design delightful user experiences for fintech products used across Africa.' },
  ];

  const createdJobs = await prisma.job.createMany({
    data: jobs,
    skipDuplicates: true,
  });
  
  console.log(`✅ Created ${createdJobs.count} jobs`);

  // Certificates
  console.log('📜 Creating certificates...');
  
  const certs = [
    { title: 'React Developer Certification', provider: 'Meta', issueDate: new Date('2024-03-15'), expiryDate: new Date('2026-03-15'), status: 'verified', credentialId: 'META-REACT-2024-001', userId: student.id },
    { title: 'JavaScript Algorithms', provider: 'freeCodeCamp', issueDate: new Date('2024-01-20'), status: 'verified', credentialId: 'FCC-JS-2024-555', userId: student.id },
    { title: 'AWS Cloud Practitioner', provider: 'Amazon Web Services', issueDate: new Date('2023-11-10'), expiryDate: new Date('2026-11-10'), status: 'pending', credentialId: 'AWS-CP-2023-789', userId: student.id },
  ];

  const createdCerts = await prisma.certificate.createMany({
    data: certs,
    skipDuplicates: true,
  });
  
  console.log(`✅ Created ${createdCerts.count} certificates`);

  // Projects
  console.log('🚀 Creating projects...');
  
  const projects = [
    { title: 'E-Commerce Platform', description: 'Full-stack e-commerce app with React, Node.js, and Stripe payments.', technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'], score: 9.2, views: 234, thumbnail: 'https://placehold.co/400x250/4f46e5/white?text=E-Commerce', userId: student.id },
    { title: 'Task Management App', description: 'Kanban-style project management tool with real-time collaboration.', technologies: ['React', 'Firebase', 'Tailwind'], score: 8.7, views: 187, thumbnail: 'https://placehold.co/400x250/10b981/white?text=Task+App', userId: student.id },
    { title: 'Weather Dashboard', description: 'Real-time weather app using OpenWeather API with beautiful charts.', technologies: ['Vue.js', 'D3.js', 'API'], score: 8.1, views: 143, thumbnail: 'https://placehold.co/400x250/f59e0b/white?text=Weather', userId: student.id },
  ];

  const createdProjects = await prisma.project.createMany({
    data: projects,
    skipDuplicates: true,
  });
  
  console.log(`✅ Created ${createdProjects.count} projects`);

  // Notifications
  console.log('🔔 Creating notifications...');
  
  const notifs = [
    { type: 'success', icon: 'certificate', title: 'Certificate Verified', message: 'React Developer Certification has been verified', userId: student.id },
    { type: 'info', icon: 'briefcase', title: 'New Job Match', message: 'Frontend Developer at TechVision (92% match)', userId: student.id },
    { type: 'warning', icon: 'calendar', title: 'Deadline Approaching', message: 'Project submission due in 3 days', read: true, userId: student.id },
  ];

  const createdNotifs = await prisma.notification.createMany({
    data: notifs,
    skipDuplicates: true,
  });
  
  console.log(`✅ Created ${createdNotifs.count} notifications`);

  console.log('🎉 Seed complete!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());