import { TokenStatus, type Token, TokenSource, PaymentStatus } from "../generated/prisma/client.js";
import { prisma } from './prisma/client.js';

export interface CreateTokenInput {
    source: TokenSource;
    priorityScore: number;
    status: TokenStatus;
    paymentStatus: PaymentStatus;

    sequenceNumber?: number;
    isEmergency?: boolean;

    patientId: string;
    doctorId: string;
    slotId: string;
    createdBy: string;
}


export class TokenRepository {
    async createToken(data: CreateTokenInput): Promise<Token> {
        return await prisma.token.create({ data });
    }

    async updateTokenStatus(tokenId: string, status: TokenStatus): Promise<void> {
        await prisma.token.update({
            where: { id: tokenId },
            data: { status }
        });
    }

    async assignSequenceNumber(tokenId: string, seq: number | null): Promise<void> {
        await prisma.token.update({
            where: { id: tokenId },
            data: { sequenceNumber: seq }
        });
    }

    async getConfirmedTokensBySlot(slotId: string): Promise<Token[]> {
        return await prisma.token.findMany({
            where: {
                slotId,
                status: 'CONFIRMED'
            },
            orderBy: {
                sequenceNumber: 'asc'
            }
        });
    }

    async getWaitlistedTokensBySlot(slotId: string): Promise<Token[]> {
        return await prisma.token.findMany({
            where: {
                slotId,
                status: TokenStatus.WAITLISTED
            },
            orderBy: [
                { priorityScore: 'desc' },
                { createdAt: 'asc' }
            ]
        });
    }

    async findLowestPriorityToken(slotId: string): Promise<Token | null> {
        return await prisma.token.findFirst({
            where: {
                slotId,
                status: 'CONFIRMED'
            },
            orderBy: [
                { priorityScore: 'asc' },
                { createdAt: 'desc' }
            ]
        });
    }
}