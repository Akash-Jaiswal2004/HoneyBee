import { PrismaClient, UserRole, AccountStatus, BatchStatus, QualityStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
}

async function main() {
  console.log('🌱 Starting database seeding...');

  const passwordHash = await hashPassword('Admin@123456');

  // 1. Seed Organizations
  const org = await prisma.organization.upsert({
    where: { code: 'ORG-APIS-01' },
    update: {},
    create: {
      name: 'Himalayan Organic Apiaries Ltd.',
      code: 'ORG-APIS-01',
      description: 'Cooperative of organic beekeepers across Uttarakhand',
      email: 'contact@himalayanbees.org',
      phone: '+91-9876543210',
      address: 'Valley View Road, Sector 4',
      district: 'Dehradun',
      state: 'Uttarakhand',
      pincode: '248001',
    },
  });

  // 2. Seed Cluster
  const cluster = await prisma.cluster.upsert({
    where: { code: 'CL-DEH-01' },
    update: {},
    create: {
      name: 'Dehradun Valley Hive Cluster A',
      code: 'CL-DEH-01',
      organizationId: org.id,
      state: 'Uttarakhand',
      district: 'Dehradun',
      latitude: 30.3165,
      longitude: 78.0322,
    },
  });

  // 3. Seed Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@honeychain.io' },
    update: {},
    create: {
      email: 'admin@honeychain.io',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
    },
  });
  console.log('  ✅ Admin user seeded: admin@honeychain.io / Admin@123456');

  // 4. Seed Beekeeper User & Profile
  const beekeeperUser = await prisma.user.upsert({
    where: { email: 'beekeeper@honeychain.io' },
    update: {},
    create: {
      email: 'beekeeper@honeychain.io',
      passwordHash,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: UserRole.BEEKEEPER,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      phone: '+91-9811223344',
    },
  });

  const beekeeper = await prisma.beekeeper.upsert({
    where: { userId: beekeeperUser.id },
    update: {},
    create: {
      userId: beekeeperUser.id,
      organizationId: org.id,
      clusterId: cluster.id,
      beekeeperCode: 'BK-UTT-101',
      registrationNumber: 'REG-BK-2025-001',
      experienceYears: 8,
      address: 'Village Maldevta',
      district: 'Dehradun',
      state: 'Uttarakhand',
      pincode: '248008',
      latitude: 30.332,
      longitude: 78.115,
    },
  });
  console.log('  ✅ Beekeeper seeded: beekeeper@honeychain.io / Admin@123456 (Code: BK-UTT-101)');

  // 5. Seed Quality Lab User
  const labUser = await prisma.user.upsert({
    where: { email: 'lab@honeychain.io' },
    update: {},
    create: {
      email: 'lab@honeychain.io',
      passwordHash,
      firstName: 'National Quality',
      lastName: 'Testing Lab',
      role: UserRole.QUALITY_LAB,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
    },
  });
  console.log('  ✅ Quality Lab user seeded: lab@honeychain.io / Admin@123456');

  // 6. Seed Hives
  const hive1 = await prisma.hive.upsert({
    where: { hiveCode: 'HIVE-001' },
    update: {},
    create: {
      hiveCode: 'HIVE-001',
      name: 'Wild Mustard Hive Alpha',
      beekeeperId: beekeeper.id,
      species: 'Apis cerana',
      hiveType: 'Langstroth 10-frame',
      establishedAt: new Date('2024-01-15'),
      status: 'ACTIVE',
      address: 'Maldevta Apiary Sector 1',
      village: 'Maldevta',
      district: 'Dehradun',
      state: 'Uttarakhand',
      latitude: 30.3321,
      longitude: 78.1152,
    },
  });

  const hive2 = await prisma.hive.upsert({
    where: { hiveCode: 'HIVE-002' },
    update: {},
    create: {
      hiveCode: 'HIVE-002',
      name: 'Eucalyptus Hive Beta',
      beekeeperId: beekeeper.id,
      species: 'Apis mellifera',
      hiveType: 'Langstroth 12-frame',
      establishedAt: new Date('2024-03-10'),
      status: 'ACTIVE',
      address: 'Maldevta Apiary Sector 2',
      village: 'Maldevta',
      district: 'Dehradun',
      state: 'Uttarakhand',
      latitude: 30.3325,
      longitude: 78.1158,
    },
  });
  console.log('  ✅ 2 Hives seeded (HIVE-001, HIVE-002)');

  // 7. Seed IoT Device for Hive 1
  await prisma.device.upsert({
    where: { deviceId: 'IOT-DEV-001' },
    update: {},
    create: {
      deviceId: 'IOT-DEV-001',
      hiveId: hive1.id,
      beekeeperId: beekeeper.id,
      deviceType: 'MULTI_SENSOR',
      firmwareVersion: 'v2.1.0',
      manufacturer: 'HoneyChain Tech',
      model: 'HC-SensorNode-X1',
      apiKey: 'api_key_hash_placeholder_001',
      status: 'ACTIVE',
      batteryLevel: 92.5,
      latitude: 30.3321,
      longitude: 78.1152,
    },
  });
  console.log('  ✅ IoT Device seeded: IOT-DEV-001');

  // 8. Seed DEMO Honey Batch: HC-DEMO-001
  const demoBatch = await prisma.honeyBatch.upsert({
    where: { publicBatchId: 'HC-DEMO-001' },
    update: {},
    create: {
      publicBatchId: 'HC-DEMO-001',
      beekeeperId: beekeeper.id,
      organizationId: org.id,
      clusterId: cluster.id,
      floralSource: 'Wild Acacia',
      variety: 'Wild Acacia Himalayan Raw Honey',
      harvestSeason: 'Spring 2025',
      harvestYear: 2025,
      totalQuantityKg: 120.0,
      remainingQuantityKg: 115.5,
      unit: 'kg',
      packagingType: '500g Food-Grade Glass Jar',
      storageConditions: 'Cool, dry ambient storage (18-24°C), protected from UV light',
      status: BatchStatus.PACKAGED,
      notes: 'DEMO DATA — Simulated provenance record for platform demonstration',
      finalizedAt: new Date('2025-04-20'),
    },
  });

  // Collection for HC-DEMO-001
  await prisma.honeyCollection.create({
    data: {
      batchId: demoBatch.id,
      hiveId: hive1.id,
      beekeeperId: beekeeper.id,
      collectionDate: new Date('2025-04-12'),
      quantityKg: 120.0,
      temperatureC: 24.5,
      humidityPercent: 58.0,
      collectedBy: beekeeperUser.id,
      notes: 'Harvested from certified organic apiary during peak acacia blossoming',
    },
  });

  // Quality Test for HC-DEMO-001
  await prisma.qualityTest.create({
    data: {
      batchId: demoBatch.id,
      testedBy: labUser.id,
      testDate: new Date('2025-04-18'),
      testStandard: 'FSSAI / Codex Alimentarius Standard CXS 12-1981',
      moisturePercent: 17.2,
      hmfMgPerKg: 11.4,
      diastaseNumber: 14.2,
      ph: 3.9,
      pollenCount: 8400,
      color: 'Extra Light Amber',
      aroma: 'Subtle floral with warm vanilla notes',
      appearance: 'Unfiltered, clear, cold-extracted raw honey',
      syrupAdulteration: false,
      antibioticResidues: false,
      pesticideResidues: false,
      heavyMetals: false,
      status: QualityStatus.PASS,
      overallGrade: 'Grade A Pure Raw Honey (99.4% Purity)',
      remarks: 'Certified pure raw honey. Zero adulterants detected.',
    },
  });

  // Blockchain Record for HC-DEMO-001
  await prisma.blockchainRecord.upsert({
    where: { batchId: demoBatch.id },
    update: {},
    create: {
      batchId: demoBatch.id,
      publicBatchId: 'HC-DEMO-001',
      batchHash: '0x4c2e1b93f07a5e8c3d1b6e4a2f9c8b7a6d5e4f3a2b1c0d9e8f7a6b5c4d8f7d6a',
      registrationTxHash: '0x8f7d6a4c2e1b93f07a5e8c3d1b6e4a2f9c8b7a6d5e4f3a2b1c0d9e8f7a6b5c4d',
      registrationBlock: 6428910,
      registrationAt: new Date('2025-04-20T14:32:00Z'),
      networkId: '11155111',
      contractAddress: '0x3B99557C4c37552F26487E130Eb4e1F04b6b66e1',
      status: 'CONFIRMED',
      verificationCount: 142,
      lastVerifiedAt: new Date(),
    },
  });

  // QR Code for HC-DEMO-001
  await prisma.qRCode.upsert({
    where: { batchId: demoBatch.id },
    update: {},
    create: {
      batchId: demoBatch.id,
      publicBatchId: 'HC-DEMO-001',
      verificationUrl: 'http://localhost:5173/verify/HC-DEMO-001',
      generatedBy: admin.id,
      isActive: true,
      scanCount: 142,
    },
  });

  // Events for HC-DEMO-001
  const events = [
    {
      eventType: 'BATCH_CREATED',
      description: 'Batch HC-DEMO-001 initialized by beekeeper Rajesh Kumar',
      eventAt: new Date('2025-04-12T08:30:00Z'),
      location: 'Maldevta Apiary, Dehradun, Uttarakhand',
    },
    {
      eventType: 'HONEY_COLLECTED',
      description: '120 kg raw honey extracted from Hive HIVE-001 at 24.5°C ambient temperature',
      eventAt: new Date('2025-04-12T11:45:00Z'),
      location: 'Maldevta Apiary, Dehradun',
    },
    {
      eventType: 'PROCESSING_STARTED',
      description: 'Gentle multi-stage mesh filtration and settling without heat pasteurization',
      eventAt: new Date('2025-04-15T09:00:00Z'),
      location: 'Himalayan Organic Apiaries Facility, Dehradun',
    },
    {
      eventType: 'QUALITY_APPROVED',
      description: 'Laboratory purity analysis passed: 17.2% moisture, HMF 11.4 mg/kg, 99.4% purity index',
      eventAt: new Date('2025-04-18T16:20:00Z'),
      location: 'National Quality Testing Lab, Dehradun',
    },
    {
      eventType: 'BATCH_PACKAGED',
      description: 'Bottled in 500g UV-protective glass jars with tamper-evident cryptographic QR seal',
      eventAt: new Date('2025-04-20T10:15:00Z'),
      location: 'Cleanroom Packaging Unit, Dehradun',
    },
    {
      eventType: 'BLOCKCHAIN_REGISTERED',
      description: 'Merkle batch fingerprint anchored to Ethereum Sepolia ledger in block #6428910',
      eventAt: new Date('2025-04-20T14:32:00Z'),
      blockchainTxHash: '0x8f7d6a4c2e1b93f07a5e8c3d1b6e4a2f9c8b7a6d5e4f3a2b1c0d9e8f7a6b5c4d',
    },
  ];

  for (const ev of events) {
    await prisma.batchEvent.create({
      data: {
        batchId: demoBatch.id,
        eventType: ev.eventType,
        performedBy: admin.id,
        description: ev.description,
        location: ev.location,
        blockchainTxHash: ev.blockchainTxHash,
        eventAt: ev.eventAt,
      },
    });
  }
  console.log('  ✅ DEMO Honey Batch seeded: HC-DEMO-001 (with QR, Lab, Blockchain & Events)');

  // 9. Also seed sample testing batch BATCH-2025-RAW-001
  const rawBatch = await prisma.honeyBatch.upsert({
    where: { publicBatchId: 'BATCH-2025-RAW-001' },
    update: {},
    create: {
      publicBatchId: 'BATCH-2025-RAW-001',
      beekeeperId: beekeeper.id,
      organizationId: org.id,
      clusterId: cluster.id,
      floralSource: 'Wild Mustard',
      variety: 'Mustard Flora Raw Honey',
      harvestSeason: 'Winter 2025',
      harvestYear: 2025,
      totalQuantityKg: 150.0,
      remainingQuantityKg: 148.5,
      unit: 'kg',
      packagingType: 'Bulk Food-Grade Drum',
      status: BatchStatus.QUALITY_TESTING,
      notes: 'Sample testing batch in lab verification phase',
    },
  });

  await prisma.honeyCollection.create({
    data: {
      batchId: rawBatch.id,
      hiveId: hive2.id,
      beekeeperId: beekeeper.id,
      collectionDate: new Date('2025-02-10'),
      quantityKg: 150.0,
      temperatureC: 18.0,
      humidityPercent: 50.0,
      collectedBy: beekeeperUser.id,
    },
  });

  console.log('  ✅ Sample Honey Batch seeded: BATCH-2025-RAW-001');
  console.log('🌱 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
