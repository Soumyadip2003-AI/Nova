import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface DiagnosticsResult {
    timestamp: string;
    environment: {
        NODE_ENV: string | undefined;
        DATABASE_URL_SET: boolean;
        DATABASE_URL_LENGTH: number;
    };
    database: {
        connected: boolean;
        error: string | null;
        messageCount?: number;
    };
    status?: 'OK' | 'ERROR';
}

export async function GET() {
    const diagnostics: DiagnosticsResult = {
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL_SET: !!process.env.DATABASE_URL,
            DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
        },
        database: {
            connected: false,
            error: null,
        },
    };

    try {
        await prisma.$connect();
        const messageCount = await prisma.message.count();
        diagnostics.database.connected = true;
        diagnostics.database.messageCount = messageCount;
        diagnostics.status = 'OK';
    } catch (error: unknown) {
        diagnostics.database.connected = false;
        diagnostics.database.error = error instanceof Error ? error.message : String(error);
        diagnostics.status = 'ERROR';
    }

    return NextResponse.json(diagnostics, {
        status: diagnostics.status === 'OK' ? 200 : 500,
    });
}
