import { PrismaClient, UserRole, EmployeeType, Gender } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@orthoalign.com' },
    update: {},
    create: {
      email: 'admin@orthoalign.com',
      passwordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });
  console.log('✓ Created admin user');

  const clientProfile = {
    gender: Gender.FEMALE,
    region: 'North America',
    phone: '+1-555-010-0001',
    website: 'https://johnson-dental.example.com',
    businessAddress: '100 Main St, Springfield, IL 62701',
    hearAboutUs: 'Seed data',
  };

  const client1 = await prisma.user.upsert({
    where: { email: 'client1@example.com' },
    update: clientProfile,
    create: {
      email: 'client1@example.com',
      passwordHash,
      name: 'Dr. Sarah Johnson',
      role: UserRole.CLIENT,
      ...clientProfile,
      gender: Gender.FEMALE,
    },
  });
  console.log('✓ Created client user 1');

  const client2Profile = {
    ...clientProfile,
    gender: Gender.MALE,
    phone: '+1-555-010-0002',
    website: 'https://brown-ortho.example.com',
    businessAddress: '200 Oak Ave, Portland, OR 97201',
  };

  const client2 = await prisma.user.upsert({
    where: { email: 'client2@example.com' },
    update: client2Profile,
    create: {
      email: 'client2@example.com',
      passwordHash,
      name: 'Dr. Michael Brown',
      role: UserRole.CLIENT,
      ...client2Profile,
    },
  });
  console.log('✓ Created client user 2');

  const designer1 = await prisma.user.upsert({
    where: { email: 'designer1@orthoalign.com' },
    update: {},
    create: {
      email: 'designer1@orthoalign.com',
      passwordHash,
      name: 'Alex Designer',
      role: UserRole.EMPLOYEE,
      employeeType: EmployeeType.DESIGNER,
    },
  });
  console.log('✓ Created designer user 1');

  const designer2 = await prisma.user.upsert({
    where: { email: 'designer2@orthoalign.com' },
    update: {},
    create: {
      email: 'designer2@orthoalign.com',
      passwordHash,
      name: 'Jordan Designer',
      role: UserRole.EMPLOYEE,
      employeeType: EmployeeType.DESIGNER,
    },
  });
  console.log('✓ Created designer user 2');

  const qc1 = await prisma.user.upsert({
    where: { email: 'qc1@orthoalign.com' },
    update: {},
    create: {
      email: 'qc1@orthoalign.com',
      passwordHash,
      name: 'Sam QC Specialist',
      role: UserRole.EMPLOYEE,
      employeeType: EmployeeType.QC,
    },
  });
  console.log('✓ Created QC user 1');

  const bothEmployee = await prisma.user.upsert({
    where: { email: 'both@orthoalign.com' },
    update: {},
    create: {
      email: 'both@orthoalign.com',
      passwordHash,
      name: 'Casey Multi-role',
      role: UserRole.EMPLOYEE,
      employeeType: EmployeeType.BOTH,
    },
  });
  console.log('✓ Created employee with both roles');

  const existingPatients = await prisma.patient.count();
  let patient1: { id: string; name: string };
  let patient2: { id: string; name: string };
  let patient3: { id: string; name: string };

  if (existingPatients > 0) {
    console.log('✓ Patients already seeded — skipping patient creation');
    const patients = await prisma.patient.findMany({
      where: { createdById: { in: [client1.id, client2.id] } },
      orderBy: { createdAt: 'asc' },
      take: 3,
      select: { id: true, name: true },
    });
    patient1 = patients[0] ?? { id: '—', name: 'John Smith' };
    patient2 = patients[1] ?? { id: '—', name: 'Emma Davis' };
    patient3 = patients[2] ?? { id: '—', name: 'Robert Wilson' };
  } else {
    patient1 = await prisma.patient.create({
      data: {
        name: 'John Smith',
        gender: Gender.MALE,
        dateOfBirth: new Date('1985-03-15'),
        address: '45 Cedar Ln, Springfield, IL 62702',
        notes: 'Regular patient, upper arch alignment needed',
        createdById: client1.id,
      },
    });
    console.log('✓ Created patient 1');

    patient2 = await prisma.patient.create({
      data: {
        name: 'Emma Davis',
        gender: Gender.FEMALE,
        dateOfBirth: new Date('1992-07-22'),
        address: '12 Maple Dr, Springfield, IL 62703',
        notes: 'First time patient',
        createdById: client1.id,
      },
    });
    console.log('✓ Created patient 2');

    patient3 = await prisma.patient.create({
      data: {
        name: 'Robert Wilson',
        gender: Gender.MALE,
        dateOfBirth: new Date('1978-11-08'),
        address: '88 Pine St, Portland, OR 97202',
        notes: 'Follow-up case',
        createdById: client2.id,
      },
    });
    console.log('✓ Created patient 3');
  }

  console.log('\n📊 Seed completed successfully!');
  console.log('\n🔑 Test Credentials (password: password123):');
  console.log('   Admin:     admin@orthoalign.com');
  console.log('   Client 1:  client1@example.com (Dr. Sarah Johnson)');
  console.log('   Client 2:  client2@example.com (Dr. Michael Brown)');
  console.log('   Designer 1: designer1@orthoalign.com');
  console.log('   Designer 2: designer2@orthoalign.com');
  console.log('   QC 1:      qc1@orthoalign.com');
  console.log('   Both:      both@orthoalign.com');
  console.log('\n👥 Sample Patients:');
  console.log(`   ${patient1.name} (ID: ${patient1.id})`);
  console.log(`   ${patient2.name} (ID: ${patient2.id})`);
  console.log(`   ${patient3.name} (ID: ${patient3.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
