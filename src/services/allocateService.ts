// src/services/allocation.service.ts

import { prisma } from '../repositories/prisma/client.js';
import { TokenSource, TokenStatus, PaymentStatus, EventEntityType } from '../generated/prisma/enums.js';

import { SlotRepository } from '../repositories/slot.repository.js';
import { TokenRepository } from '../repositories/token.repository.js';
import { PatientRepository } from '../repositories/patient.repository.js';
import { EventRepository } from '../repositories/event.repository.js';
import { calculatePriority } from '../utils/calculatePriority.js';
import type { Token } from 'generated/prisma/client.js';
import { injectable } from 'inversify';

interface RequestTokenInput {
    patient: {
        name: string;
        phone?: string;
        dob?: Date;
    };
    doctorId: string;
    slotId: string;
    source: TokenSource;
    paymentStatus: PaymentStatus;
    isEmergency?: boolean;
    requestedBy: string; // userId (EMPLOYEE / DOCTOR / SYSTEM)
}

export class AllocationService {
    private slotRepo = new SlotRepository();
    private tokenRepo = new TokenRepository();
    private patientRepo = new PatientRepository();
    private eventRepo = new EventRepository();

    /**
     * ---------------------------
     * REQUEST / ALLOCATE TOKEN
     * ---------------------------
     */
    async requestToken(input: RequestTokenInput): Promise<Token> {
        // 1. Lock slot
        await this.slotRepo.lockSlot(input.slotId);

        // 2. Resolve patient
        let patient = input.patient.phone
            ? await this.patientRepo.findByPhone(input.patient.phone)
            : null;

        if (!patient) {
            patient = await this.patientRepo.createPatient(input.patient);
        }

        // 3. Calculate priority
        const priorityScore = calculatePriority({
            source: input.source,
            paymentStatus: input.paymentStatus,
            isEmergency: input.isEmergency ?? false
        });

        // 4. Count confirmed tokens
        const confirmedCount =
            await this.slotRepo.countConfirmedTokens(input.slotId);

        const slot = await this.slotRepo.getById(input.slotId);
        if (!slot) throw new Error('Slot not found');

        // 5. Create token in REQUESTED state
        const token = await this.tokenRepo.createToken({
            patientId: patient.id,
            doctorId: input.doctorId,
            slotId: input.slotId,
            source: input.source,
            paymentStatus: input.paymentStatus,
            priorityScore,
            isEmergency: !!input.isEmergency,
            status: TokenStatus.REQUESTED,
            createdBy: input.requestedBy
        });

        // 6. Allocation decision
        if (confirmedCount < slot.hardCapacity) {
            // CONFIRM directly
            await this.confirmToken(token.id, confirmedCount + 1);
        } else {
            // Slot full → check displacement
            const lowest =
                await this.tokenRepo.findLowestPriorityToken(input.slotId);

            if (
                lowest &&
                priorityScore > lowest.priorityScore
            ) {
                // Displace lower-priority token
                await this.displaceToken(lowest.id);
                await this.confirmToken(token.id, slot.hardCapacity);
            } else {
                // WAITLIST
                await this.tokenRepo.updateTokenStatus(
                    token.id,
                    TokenStatus.WAITLISTED
                );
            }
        }

        // 7. Emit event
        await this.eventRepo.appendEvent({
            entityType: EventEntityType.TOKEN,
            entityId: token.id,
            eventType: 'TOKEN_REQUESTED',
            eventPayload: { source: input.source },
            actorId: input.requestedBy
        });

        return token;
    }

    /**
     * ---------------------------
     * CONFIRM TOKEN
     * ---------------------------
     */
    private async confirmToken(tokenId: string, sequence: number) {
        await this.tokenRepo.updateTokenStatus(tokenId, TokenStatus.CONFIRMED);
        await this.tokenRepo.assignSequenceNumber(tokenId, sequence);
    }

    /**
     * ---------------------------
     * DISPLACE TOKEN
     * ---------------------------
     */
    private async displaceToken(tokenId: string) {
        await this.tokenRepo.updateTokenStatus(
            tokenId,
            TokenStatus.WAITLISTED
        );
        await this.tokenRepo.assignSequenceNumber(tokenId, null);

        await this.eventRepo.appendEvent({
            entityType: EventEntityType.TOKEN,
            entityId: tokenId,
            eventType: 'TOKEN_DISPLACED'
        });
    }

    /**
     * ---------------------------
     * CANCEL TOKEN
     * ---------------------------
     */
    async cancelToken(tokenId: string, actorId: string) {

        await this.tokenRepo.updateTokenStatus(
            tokenId,
            TokenStatus.CANCELLED
        );

        await this.eventRepo.appendEvent({
            entityType: EventEntityType.TOKEN,
            entityId: tokenId,
            eventType: 'TOKEN_CANCELLED',
            actorId
        });

        await this.promoteFromWaitlist(tokenId);
    }

    /**
     * ---------------------------
     * HANDLE NO-SHOW
     * ---------------------------
     */
    async markNoShow(tokenId: string) {

        await this.tokenRepo.updateTokenStatus(
            tokenId,
            TokenStatus.NO_SHOW
        );
        await this.promoteFromWaitlist(tokenId);
    }

    /**
     * ---------------------------
     * PROMOTE WAITLIST
     * ---------------------------
     */
    private async promoteFromWaitlist(slotId: string) {
        const confirmedCount =
            await this.slotRepo.countConfirmedTokens(slotId);

        const slot = await this.slotRepo.getById(slotId);
        if (!slot) return;

        if (confirmedCount >= slot.hardCapacity) return;

        const waitlisted =
            await this.tokenRepo.getWaitlistedTokensBySlot(slotId);

        const [next] = waitlisted;
        if (!next) return;

        await this.confirmToken(next.id, confirmedCount + 1);
    }

}
