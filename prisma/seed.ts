import { PrismaClient, Prisma } from "../src/generated/prisma";

const prisma = new PrismaClient();

const projectData: Prisma.ProjectCreateInput[] = [
  {
    name: "AI Chat Application",
    messages: {
      create: [
        {
          content: "Hello! How can I help you today?",
          role: "ASSISTANT",
          type: "RESULT",
        },
        {
          content: "Can you help me build a web app?",
          role: "USER",
          type: "RESULT",
        },
        {
          content: "Of course! I'd be happy to help. What kind of web app would you like to build?",
          role: "ASSISTANT",
          type: "RESULT",
        },
      ],
    },
  },
  {
    name: "Code Generator",
    messages: {
      create: [
        {
          content: "Generate a React component",
          role: "USER",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: "https://codesandbox.io/example",
              title: "Sample React Component",
              files: {
                "App.tsx": "import React from 'react';\n\nexport default function App() {\n  return <div>Hello World</div>;\n}",
              },
            },
          },
        },
      ],
    },
  },
];

export async function main() {
  console.log("Starting seed...");

  for (const p of projectData) {
    const project = await prisma.project.create({ data: p });
    console.log(`Created project: ${project.name}`);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });