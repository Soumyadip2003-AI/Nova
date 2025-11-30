import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function main() {
    console.log('Testing DB connection...');
    try {
        const count = await prisma.message.count();
        console.log(`Successfully connected. Message count: ${count}`);

        console.log('Attempting to create a message...');
        const message = await prisma.message.create({
            data: {
                content: 'Test message from script',
                role: 'USER',
                type: 'RESULT',
            },
        });
        console.log('Successfully created message:', message.id);

        // Clean up
        await prisma.message.delete({ where: { id: message.id } });
        console.log('Successfully deleted test message');

    } catch (error) {
        console.error('DB Connection or Operation failed:', error);
        process.exit(1);
    }
}

main();
