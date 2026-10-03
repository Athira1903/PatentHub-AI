import { PrismaClient, ProjectStage, ProjectRole, PermissionLevel } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PatentHub AI Database Seeding...');

  // 1. Roles
  const roles = [
    { name: 'Inventor', permissions: ['view_project', 'create_project', 'edit_project', 'delete_project', 'view_claims', 'create_claims', 'edit_claims', 'view_documents', 'upload_documents', 'search_prior_art', 'add_prior_art'] },
    { name: 'CoInventor', permissions: ['view_project', 'edit_project', 'view_claims', 'create_claims', 'edit_claims', 'view_documents', 'upload_documents', 'search_prior_art', 'add_prior_art'] },
    { name: 'Guide', permissions: ['view_project', 'view_claims', 'run_claim_analysis', 'view_documents', 'view_reviews', 'submit_review', 'approve_reject_review', 'search_prior_art'] },
    { name: 'PatentExpert', permissions: ['view_project', 'view_claims', 'run_claim_analysis', 'view_documents', 'view_reviews', 'submit_review', 'approve_reject_review', 'search_prior_art', 'add_prior_art'] },
    { name: 'Admin', permissions: ['manage_users', 'manage_projects', 'view_audit', 'system_config', 'view_project', 'create_project', 'edit_project', 'delete_project'] },
    { name: 'INVENTOR', permissions: [] },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { permissions: r.permissions },
      create: { name: r.name, permissions: r.permissions },
    });
  }
  console.log('✓ Roles verified.');

  const inventorRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Inventor' } });
  const coInventorRole = await prisma.role.findUniqueOrThrow({ where: { name: 'CoInventor' } });
  const guideRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Guide' } });
  const expertRole = await prisma.role.findUniqueOrThrow({ where: { name: 'PatentExpert' } });
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Admin' } });

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 2. Sample Users
  const usersData = [
    {
      username: 'STU202600001',
      fullName: 'Athira Biju',
      email: 'athirabiju2027@mca.ajce.in',
      roleId: inventorRole.id,
      institution: 'Amal Jyothi College of Engineering',
      department: 'Computer Science',
      designation: 'Student Researcher',
      phone: '+91 9876543210',
      researchDomain: 'IoT & Smart Systems',
    },
    {
      username: 'COI20260001',
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@mca.ajce.in',
      roleId: coInventorRole.id,
      institution: 'Amal Jyothi College of Engineering',
      department: 'Electronics & Communication',
      designation: 'Research Associate',
      phone: '+91 9876543211',
      researchDomain: 'Hardware & Sensor Engineering',
    },
    {
      username: 'GDE20260001',
      fullName: 'Dr. Arun Kumar',
      email: 'arun.kumar@mca.ajce.in',
      roleId: guideRole.id,
      institution: 'Amal Jyothi College of Engineering',
      department: 'Computer Applications',
      designation: 'Associate Professor & Guide',
      phone: '+91 9876543212',
      researchDomain: 'Artificial Intelligence & Embedded IoT',
    },
    {
      username: 'PEX20260001',
      fullName: 'Adv. Meera Nair',
      email: 'adithyabiju2228@gmail.com',
      roleId: expertRole.id,
      institution: 'National IP Advisory Council',
      department: 'Patent Law & Drafting',
      designation: 'Registered Patent Agent (IN/PA-4210)',
      phone: '+91 9876543213',
      researchDomain: 'Patent Drafting & FTO Analysis',
    },
    {
      username: 'ADM20260001',
      fullName: 'System Administrator',
      email: 'bijuathira003@gmail.com',
      roleId: adminRole.id,
      institution: 'PatentHub AI Operations',
      department: 'System Architecture',
      designation: 'Platform Administrator',
      phone: '+91 9876543214',
      researchDomain: 'System Administration',
    },
  ];

  const seededUsers: Record<string, any> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        fullName: u.fullName,
        email: u.email,
        password: passwordHash,
        institution: u.institution,
        roleId: u.roleId,
        isActive: true,
      },
      create: {
        username: u.username,
        fullName: u.fullName,
        email: u.email,
        password: passwordHash,
        institution: u.institution,
        roleId: u.roleId,
        isActive: true,
      },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        phone: u.phone,
        institution: u.institution,
        department: u.department,
        designation: u.designation,
        researchDomain: u.researchDomain,
        profileCompleted: true,
      },
      create: {
        userId: user.id,
        phone: u.phone,
        dob: new Date('2000-01-01'),
        gender: 'Not specified',
        institution: u.institution,
        department: u.department,
        designation: u.designation,
        researchDomain: u.researchDomain,
        profileCompleted: true,
      },
    });

    seededUsers[u.username] = user;
  }
  console.log('✓ Users & Profiles verified.');

  // 3. IPC Classifications Dataset
  const ipcData = [
    {
      fullSymbol: 'B65D 51/24',
      section: 'B',
      sectionTitle: 'Performing Operations; Transporting',
      classCode: 'B65',
      classTitle: 'Conveying; Packing; Storing; Handling Thin or Filamentary Material',
      subclass: 'B65D',
      subclassTitle: 'Containers for storage or transport of articles or materials',
      mainGroup: '51/00',
      subgroup: '51/24',
      title: 'Closures with auxiliary devices or arrangements for purposes other than closing',
      description: 'Closures for bottles or containers provided with internal or external functional features including electronic sensors or dispensers.',
      domain: 'IoT',
      keywords: 'smart bottle, closure, container, cap, sensor',
    },
    {
      fullSymbol: 'H02J 7/35',
      section: 'H',
      sectionTitle: 'Electricity',
      classCode: 'H02',
      classTitle: 'Generation; Conversion or Distribution of Electric Power',
      subclass: 'H02J',
      subclassTitle: 'Circuit arrangements for electric power supply or distribution',
      mainGroup: '7/00',
      subgroup: '7/35',
      title: 'Parallel charging or battery maintenance with photovoltaic generators',
      description: 'Circuit topologies and power regulation for harvesting energy from solar cells directly to auxiliary rechargeable batteries.',
      domain: 'Energy',
      keywords: 'solar charging, photovoltaic, battery power, harvesting',
    },
    {
      fullSymbol: 'G16Y 40/00',
      section: 'G',
      sectionTitle: 'Physics',
      classCode: 'G16',
      classTitle: 'Information and Communication Technology [ICT] Specially Adapted for Specific Application Fields',
      subclass: 'G16Y',
      subclassTitle: 'Information and communication technology specially adapted for the Internet of Things [IoT]',
      mainGroup: '40/00',
      subgroup: '40/00',
      title: 'ICT specially adapted for the Internet of Things [IoT]',
      description: 'Sensor telemetry, wireless transceivers, and embedded IoT architectures monitoring physical conditions.',
      domain: 'IoT',
      keywords: 'IoT, wireless telemetry, sensor network, remote monitoring',
    },
    {
      fullSymbol: 'A01G 25/16',
      section: 'A',
      sectionTitle: 'Human Necessities',
      classCode: 'A01',
      classTitle: 'Agriculture; Forestry; Animal Husbandry; Hunting; Trapping; Fishing',
      subclass: 'A01G',
      subclassTitle: 'Horticulture; Cultivation of vegetables, flowers, rice, fruit, vines, hops or seaweed',
      mainGroup: '25/00',
      subgroup: '25/16',
      title: 'Control of watering arrangements based on environmental or soil moisture conditions',
      description: 'Automated irrigation control systems reacting to sensor measurements in agricultural fields.',
      domain: 'Agriculture',
      keywords: 'crop monitoring, irrigation, soil moisture, automated watering',
    },
    {
      fullSymbol: 'G06N 3/08',
      section: 'G',
      sectionTitle: 'Physics',
      classCode: 'G06',
      classTitle: 'Computing; Calculating or Counting',
      subclass: 'G06N',
      subclassTitle: 'Computing arrangements based on specific computational models',
      mainGroup: '3/00',
      subgroup: '3/08',
      title: 'Learning methods for artificial neural networks',
      description: 'Techniques for supervised and unsupervised training of deep neural networks.',
      domain: 'AI / Computing',
      keywords: 'machine learning, neural networks, computer vision, deep learning',
    },
    {
      fullSymbol: 'A61B 5/0205',
      section: 'A',
      sectionTitle: 'Human Necessities',
      classCode: 'A01',
      classTitle: 'Medical or Veterinary Science; Hygiene',
      subclass: 'A61B',
      subclassTitle: 'Diagnosis; Surgery; Identification',
      mainGroup: '5/00',
      subgroup: '5/0205',
      title: 'Simultaneously evaluating multiple physiological parameters',
      description: 'Medical and personal monitoring devices measuring hydration, heart rate, or physiological telemetry.',
      domain: 'Healthcare',
      keywords: 'hydration monitoring, physiological sensors, biometric diagnostics',
    },
    {
      fullSymbol: 'H04L 9/40',
      section: 'H',
      sectionTitle: 'Electricity',
      classCode: 'H04',
      classTitle: 'Electric Communication Technique',
      subclass: 'H04L',
      subclassTitle: 'Transmission of digital information',
      mainGroup: '9/00',
      subgroup: '9/40',
      title: 'Network security protocols; Network security architectures',
      description: 'Cryptographic gateways, hardware security modules, and edge device verification.',
      domain: 'Cybersecurity',
      keywords: 'IoT gateway, cryptographic authentication, hardware security',
    },
  ];

  const seededIPC: Record<string, any> = {};
  for (const ipc of ipcData) {
    const record = await prisma.iPCClassification.upsert({
      where: { fullSymbol: ipc.fullSymbol },
      update: ipc,
      create: ipc,
    });
    seededIPC[ipc.fullSymbol] = record;
  }
  console.log('✓ IPC Classifications seeded.');

  const athira = seededUsers['STU202600001'];
  const rahul = seededUsers['COI20260001'];
  const drArun = seededUsers['GDE20260001'];
  const meera = seededUsers['PEX20260001'];

  // 4. Sample Projects

  // Project 1: Smart Solar Water Bottle
  let p1 = await prisma.patentProject.findFirst({
    where: { title: 'Smart Solar Water Bottle' },
  });

  if (!p1) {
    p1 = await prisma.patentProject.create({
      data: {
        title: 'Smart Solar Water Bottle',
        innovationIdea: 'A self-powered hydration monitoring bottle integrating a photovoltaic harvesting lid, capacitive liquid level sensing, and Bluetooth Low Energy telemetry.',
        problemStatement: 'Existing water bottles require frequent plug-in recharging and fail to accurately measure liquid consumption in outdoor environments without active power sources.',
        existingSolutions: 'Standard smart bottles require USB recharging every 3-5 days. Simple solar flasks have no internal volume sensing.',
        proposedSolution: 'An integrated micro-photovoltaic lid coupled with a low-power capacitive sensor array that continuously charges an internal lithium titanate cell while tracking fluid intake.',
        technicalDomain: 'IoT',
        category: 'Consumer Product / IoT',
        patentCategory: 'PRODUCT_AND_PROCESS',
        specificationType: 'COMPLETE',
        stage: ProjectStage.PRIOR_ART_ANALYSIS,
        ownerId: athira.id,
      },
    });
  } else {
    await prisma.patentProject.update({
      where: { id: p1.id },
      data: {
        stage: ProjectStage.PRIOR_ART_ANALYSIS,
        specificationType: 'COMPLETE',
        patentCategory: 'PRODUCT_AND_PROCESS',
      },
    });
  }

  // Members
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: p1.id, userId: athira.id } },
    update: { role: ProjectRole.INVENTOR, permissionLevel: PermissionLevel.SUBMIT },
    create: { projectId: p1.id, userId: athira.id, role: ProjectRole.INVENTOR, permissionLevel: PermissionLevel.SUBMIT },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: p1.id, userId: rahul.id } },
    update: { role: ProjectRole.CO_INVENTOR, permissionLevel: PermissionLevel.EDIT },
    create: { projectId: p1.id, userId: rahul.id, role: ProjectRole.CO_INVENTOR, permissionLevel: PermissionLevel.EDIT },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: p1.id, userId: drArun.id } },
    update: { role: ProjectRole.GUIDE, permissionLevel: PermissionLevel.EDIT },
    create: { projectId: p1.id, userId: drArun.id, role: ProjectRole.GUIDE, permissionLevel: PermissionLevel.EDIT },
  });

  // Link IPC
  for (const sym of ['B65D 51/24', 'H02J 7/35', 'G16Y 40/00']) {
    if (seededIPC[sym]) {
      await prisma.patentProjectIPC.upsert({
        where: { projectId_ipcId: { projectId: p1.id, ipcId: seededIPC[sym].id } },
        update: {},
        create: { projectId: p1.id, ipcId: seededIPC[sym].id, isPrimary: sym === 'B65D 51/24' },
      });
    }
  }

  // Legal Applicants & Inventors
  await prisma.applicant.deleteMany({ where: { projectId: p1.id } });
  await prisma.applicant.create({
    data: {
      projectId: p1.id,
      name: 'Athira Biju',
      applicantType: 'INDIVIDUAL',
      address: 'Department of Computer Science, AJCE, Kanjirappally, Kerala - 686518',
      country: 'India',
      nationality: 'Indian',
      email: 'athirabiju2027@mca.ajce.in',
      phone: '+91 9876543210',
      isPrimary: true,
    },
  });

  await prisma.inventor.deleteMany({ where: { projectId: p1.id } });
  await prisma.inventor.createMany({
    data: [
      {
        projectId: p1.id,
        name: 'Athira Biju',
        address: 'Department of Computer Science, AJCE, Kanjirappally, Kerala - 686518',
        country: 'India',
        nationality: 'Indian',
        email: 'athirabiju2027@mca.ajce.in',
        phone: '+91 9876543210',
        contribution: 'Lead architectural design, capacitive sensing firmware, and BLE telemetry integration.',
        inventorshipDeclarationSigned: true,
        orderIndex: 0,
        isPrimary: true,
      },
      {
        projectId: p1.id,
        name: 'Rahul Sharma',
        address: 'Department of Electronics & Communication, AJCE, Kanjirappally, Kerala - 686518',
        country: 'India',
        nationality: 'Indian',
        email: 'rahul.sharma@mca.ajce.in',
        phone: '+91 9876543211',
        contribution: 'Photovoltaic cap power conditioning circuitry and optical layer design.',
        inventorshipDeclarationSigned: true,
        orderIndex: 1,
        isPrimary: false,
      },
    ],
  });

  // Structured Specification
  await prisma.specification.deleteMany({ where: { projectId: p1.id } });
  await prisma.specification.create({
    data: {
      projectId: p1.id,
      title: 'Smart Solar Water Bottle with Autonomous Hydration Sensing and Power Harvesting',
      abstract: 'A self-sustaining smart liquid container comprises an insulated housing, an energy harvesting cap equipped with a monocrystalline photovoltaic cell, an internal capacitive volume sensing column, and an ultra-low-power telemetry microcontroller.',
      background: 'In outdoor, field-work, and athletic environments, individuals frequently encounter dehydration due to lack of real-time monitoring. Conventional smart containers require USB charging docks that are inaccessible during prolonged outdoor excursions.',
      problem: 'Conventional smart vessels fail to operate autonomously off-grid and suffer from sensor drift when measuring varying liquid temperatures.',
      proposedSolution: 'A sealed cap incorporates high-efficiency photovoltaic cells coupled to a maximum power point tracking (MPPT) circuit, continuously replenishing a lithium titanate capacitor to power non-contact capacitive level sensors.',
      summary: 'The invention provides a robust, self-powered smart bottle that eliminates plug-in recharging while delivering real-time intake telemetry via BLE.',
      technicalComponents: '1. Double-walled vacuum insulated stainless steel cylinder; 2. Photovoltaic cap with hydrophobic coating; 3. MPPT power management unit; 4. Capacitive sensing strip; 5. Nordic nRF52840 BLE SoC.',
      workingPrinciple: 'Ambient and direct sunlight incident on the lid is harvested by the photovoltaic matrix. The MPPT circuit regulates voltage to buffer energy. When fluid is consumed, capacitive change along the internal column is converted into volume metrics.',
      advantages: 'Zero dependence on wall chargers; fully hermetic design; robust temperature compensation.',
      applications: 'Field sports, military expeditions, remote hiking, and clinical dehydration monitoring.',
      specificationType: 'COMPLETE',
      version: 1,
      isCurrent: true,
    },
  });

  // Prior Art Records
  const priorArtItems = [
    {
      patentNumber: 'US10925432B2',
      title: 'Solar-Powered Hydration Tracking Bottle with Liquid Display',
      abstract: 'A hydration tracking bottle comprising a solar panel positioned on a side wall and an LED progress bar indicating hydration targets.',
      assignee: 'Apex Wellness Inc',
      inventors: 'Johnson, Mark et al.',
      source: 'USPTO',
      url: 'https://patents.google.com/patent/US10925432B2',
    },
    {
      patentNumber: 'US20210345678A1',
      title: 'Capacitive Fluid Volume Sensor for Beverage Containers',
      abstract: 'A capacitive strip arrangement mounted along the interior perimeter of a bottle for measuring liquid level via dielectric permittivity shifts.',
      assignee: 'HydraTech Global Corp',
      inventors: 'Chen, Wei',
      source: 'USPTO',
      url: 'https://patents.google.com/patent/US20210345678A1',
    },
    {
      patentNumber: 'WO2022119988A1',
      title: 'Smart Vessel with Autonomous Micro-Energy Harvesting',
      abstract: 'An energy-harvesting bottle cap utilizing thermoelectric modules to generate energy from warm beverages.',
      assignee: 'European EcoVentures BV',
      inventors: 'Schmidt, Klaus',
      source: 'WIPO',
      url: 'https://patents.google.com/patent/WO2022119988A1',
    },
  ];

  for (const pa of priorArtItems) {
    await prisma.patentReference.upsert({
      where: { projectId_patentNumber: { projectId: p1.id, patentNumber: pa.patentNumber } },
      update: pa,
      create: { ...pa, projectId: p1.id },
    });
  }

  // Claims
  await prisma.patentClaim.deleteMany({ where: { projectId: p1.id } });
  const claim1 = await prisma.patentClaim.create({
    data: {
      projectId: p1.id,
      claimNumber: 1,
      claimType: 'INDEPENDENT',
      preamble: 'A solar-powered smart hydration apparatus comprising:',
      body: 'a thermally insulated vessel defining an interior liquid reservoir; a hermetically sealed closure cap removably engageable with said vessel, wherein said closure cap comprises a convex upper surface having an integrated photovoltaic energy harvesting array; a non-contact capacitive fluid volume sensor disposed lengthwise along an internal surface of said vessel; a power management microcontroller housed within said closure cap and electrically coupled to said photovoltaic array and said fluid volume sensor; and a wireless telemetry module configured to transmit fluid consumption telemetry to an external computing device.',
      status: 'DRAFT',
      orderIndex: 0,
    },
  });

  await prisma.patentClaim.create({
    data: {
      projectId: p1.id,
      claimNumber: 2,
      claimType: 'DEPENDENT',
      dependsOnNumber: 1,
      preamble: 'The apparatus of claim 1, further comprising:',
      body: 'a UV-C ultraviolet sterilization emitter positioned on a downward-facing interior surface of said closure cap and driven by power harvested by said photovoltaic array.',
      status: 'DRAFT',
      orderIndex: 1,
    },
  });

  await prisma.patentClaim.create({
    data: {
      projectId: p1.id,
      claimNumber: 3,
      claimType: 'DEPENDENT',
      dependsOnNumber: 1,
      preamble: 'The apparatus of claim 1, wherein:',
      body: 'said photovoltaic energy harvesting array comprises a curved monocrystalline silicon matrix coated with a self-cleaning hydrophobic nanocoating.',
      status: 'DRAFT',
      orderIndex: 2,
    },
  });

  // Tasks
  await prisma.task.deleteMany({ where: { projectId: p1.id } });
  await prisma.task.createMany({
    data: [
      {
        projectId: p1.id,
        title: 'Review 3 saved prior-art documents',
        description: 'Analyze potential technical overlap between US10925432B2 and our top-mounted solar cap design.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignedToId: athira.id,
      },
      {
        projectId: p1.id,
        title: 'Draft dependent claim for UV-C sterilization power duty cycle',
        description: 'Specify the periodic pulse modulation of the UV emitter under low battery states.',
        status: 'TODO',
        priority: 'MEDIUM',
        assignedToId: rahul.id,
      },
      {
        projectId: p1.id,
        title: 'Upload FIG. 1 perspective assembly drawing',
        description: 'Produce high-resolution vector or PNG schematic showing cap, vessel, and capacitive strip.',
        status: 'TODO',
        priority: 'MEDIUM',
        assignedToId: athira.id,
      },
    ],
  });

  // Project 2: Smart Traffic Optimization
  let p2 = await prisma.patentProject.findFirst({
    where: { title: 'Smart Traffic Optimization' },
  });

  if (!p2) {
    p2 = await prisma.patentProject.create({
      data: {
        title: 'Smart Traffic Optimization',
        innovationIdea: 'Decentralized urban intersection control using roadside edge AI and queue length predictive models.',
        problemStatement: 'Fixed-cycle and centralized traffic lights fail to adapt dynamically to emergency vehicles and unexpected arterial bottlenecks.',
        proposedSolution: 'Edge vision processors at intersections negotiate green-wave clearance using localized federated consensus without central cloud latency.',
        technicalDomain: 'AI',
        category: 'AI / Transportation',
        patentCategory: 'PROCESS',
        specificationType: 'COMPLETE',
        stage: ProjectStage.REVIEW,
        ownerId: athira.id,
      },
    });
  } else {
    await prisma.patentProject.update({
      where: { id: p2.id },
      data: { stage: ProjectStage.REVIEW, specificationType: 'COMPLETE' },
    });
  }

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: p2.id, userId: athira.id } },
    update: { role: ProjectRole.INVENTOR },
    create: { projectId: p2.id, userId: athira.id, role: ProjectRole.INVENTOR },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: p2.id, userId: drArun.id } },
    update: { role: ProjectRole.GUIDE },
    create: { projectId: p2.id, userId: drArun.id, role: ProjectRole.GUIDE },
  });

  await prisma.projectReview.deleteMany({ where: { projectId: p2.id } });
  await prisma.projectReview.create({
    data: {
      projectId: p2.id,
      reviewerId: drArun.id,
      reviewType: 'GUIDE_REVIEW',
      decision: 'CHANGES_REQUESTED',
      comments: 'The independent process claim is promising, but the mathematical formulation for the edge consensus requires elaboration under extreme network packet loss.',
    },
  });

  // Project 3: AI-Based Crop Monitoring
  let p3 = await prisma.patentProject.findFirst({
    where: { title: 'AI-Based Crop Monitoring' },
  });

  if (!p3) {
    p3 = await prisma.patentProject.create({
      data: {
        title: 'AI-Based Crop Monitoring',
        innovationIdea: 'Multispectral drone imaging pipeline detecting early pest infestation in tea plantations.',
        problemStatement: 'Manual plantation inspections miss early nymph manifestations on the underside of tea leaves until severe crop loss occurs.',
        proposedSolution: 'Low-altitude UAV flights coupled with narrow-band infrared illumination and on-device lightweight edge vision models.',
        technicalDomain: 'Agriculture',
        category: 'Agriculture & AI',
        patentCategory: 'PRODUCT_AND_PROCESS',
        specificationType: 'COMPLETE',
        stage: ProjectStage.INNOVATION_DETAILS,
        ownerId: athira.id,
      },
    });
  } else {
    await prisma.patentProject.update({
      where: { id: p3.id },
      data: { stage: ProjectStage.INNOVATION_DETAILS },
    });
  }

  // Project 4: Secure IoT Gateway
  let p4 = await prisma.patentProject.findFirst({
    where: { title: 'Secure IoT Gateway' },
  });

  const provisionalFilingDate = new Date();
  provisionalFilingDate.setMonth(provisionalFilingDate.getMonth() - 6); // Filed 6 months ago

  const completeDeadlineDate = new Date(provisionalFilingDate);
  completeDeadlineDate.setMonth(completeDeadlineDate.getMonth() + 12); // 12 months from provisional

  if (!p4) {
    p4 = await prisma.patentProject.create({
      data: {
        title: 'Secure IoT Gateway',
        innovationIdea: 'Hardware-enforced zero-trust cryptographic perimeter for legacy industrial SCADA sensor arrays.',
        problemStatement: 'Legacy serial sensors lack cryptographic accelerators and are vulnerable to man-in-the-middle replay attacks.',
        proposedSolution: 'An inline physical micro-appliance providing asymmetric signature verification without modifying existing PLC firmware.',
        technicalDomain: 'Cybersecurity',
        category: 'Hardware & Cybersecurity',
        patentCategory: 'PRODUCT',
        specificationType: 'PROVISIONAL',
        stage: ProjectStage.FILING_READY,
        ownerId: athira.id,
      },
    });
  } else {
    await prisma.patentProject.update({
      where: { id: p4.id },
      data: {
        stage: ProjectStage.FILING_READY,
        specificationType: 'PROVISIONAL',
      },
    });
  }

  // Add Applicants and Inventors for P4
  await prisma.applicant.deleteMany({ where: { projectId: p4.id } });
  await prisma.applicant.create({
    data: {
      projectId: p4.id,
      name: 'Amal Jyothi Innovation and Incubation Centre',
      applicantType: 'EDUCATIONAL_INSTITUTE',
      address: 'Koovappally P.O., Kanjirappally, Kottayam, Kerala - 686518',
      country: 'India',
      nationality: 'Indian',
      email: 'incubation@ajce.in',
      phone: '+91 4828 305555',
      isPrimary: true,
    },
  });

  await prisma.inventor.deleteMany({ where: { projectId: p4.id } });
  await prisma.inventor.create({
    data: {
      projectId: p4.id,
      name: 'Athira Biju',
      address: 'Department of Computer Science, AJCE, Kerala - 686518',
      country: 'India',
      nationality: 'Indian',
      email: 'athirabiju2027@mca.ajce.in',
      contribution: 'Cryptographic architecture and zero-trust protocol implementation.',
      inventorshipDeclarationSigned: true,
      orderIndex: 0,
      isPrimary: true,
    },
  });

  // Add Filing Event and Deadline for P4
  await prisma.filingEvent.deleteMany({ where: { projectId: p4.id } });
  await prisma.filingEvent.create({
    data: {
      projectId: p4.id,
      eventType: 'PROVISIONAL_FILING',
      filingDate: provisionalFilingDate,
      applicationNumber: '202641019876',
      cbrNumber: 'CBR-CHE-2026-08812',
      status: 'FILED',
      description: 'Provisional specification filed at Indian Patent Office (Chennai Branch).',
    },
  });

  await prisma.deadline.deleteMany({ where: { projectId: p4.id } });
  await prisma.deadline.create({
    data: {
      projectId: p4.id,
      deadlineType: 'COMPLETE_SPECIFICATION_FILING',
      referenceEvent: 'PROVISIONAL_FILING',
      dueDate: completeDeadlineDate,
      status: 'APPROACHING',
      description: 'Statutory deadline to file Complete Specification under Section 9(1) of the Indian Patents Act, 1970 (12 months from provisional filing).',
    },
  });

  console.log('✓ Projects, Specifications, Prior Art, Claims, Deadlines, and Events seeded successfully!');
  console.log('🎉 Seed complete! Ready for PatentHub AI.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
