import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function main() {
    console.log('Testing DB connection...');
    try {
        const count = await prisma.project.count();
        console.log(`Successfully connected. Project count: ${count}`);

        console.log('Attempting to create a test project...');
        const project = await prisma.project.create({
            data: {
                name: 'Test Project from script',
                userId: 'test_user_id',
            },
        });
        console.log('Successfully created project:', project.id);

        // Clean up
        await prisma.project.delete({ where: { id: project.id } });
        console.log('Successfully deleted test project');

    } catch (error) {
        console.error('DB Connection or Operation failed:', error);
        process.exit(1);
    }
}

main();
