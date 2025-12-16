import fs from 'fs';
import path from 'path';
import { PrismaClient } from './src/generated/prisma/index.js';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Manually load .env
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
} else {
  console.error(".env file not found!");
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log(`DATABASE_URL length: ${connectionString ? connectionString.length : 'undefined'}`);
  
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in .env file");
  }

  // Match src/lib/db.ts approach exactly
  // src/lib/db.ts: const adapter = new PrismaNeon({ connectionString })
  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log("Checking Projects and their Messages...");
  const projects = await prisma.project.findMany({
    include: {
      messages: {
        include: {
          fragment: true
        }
      },
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5
  });

  if (projects.length === 0) {
    console.log("No projects found.");
  } else {
    projects.forEach(p => {
      console.log(`Project: ${p.name} (${p.id})`);
      console.log(`- Message Count: ${p.messages.length}`);
      p.messages.forEach(m => {
        const fragmentInfo = m.fragment ? `[Has Fragment: ${m.fragment.title}]` : '';
        console.log(`  - Message: ${m.content} (${m.role}) [${m.type}] ${fragmentInfo}`);
      });
      console.log('---');
    });
  }

  const fragments = await prisma.fragment.findMany();
  console.log(`Total Fragments found: ${fragments.length}`);
  fragments.forEach(f => {
    console.log(`- Fragment: ${f.title} (Message ID: ${f.messageId})`);
  });

  const errorMessages = await prisma.message.findMany({
    where: {
      type: 'ERROR'
    }
  });
  console.log(`Total ERROR messages found: ${errorMessages.length}`);
  errorMessages.forEach(m => {
    console.log(`- Error Message: ${m.content} (Project: ${m.projectId})`);
  });
  
  await prisma.$disconnect();
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
