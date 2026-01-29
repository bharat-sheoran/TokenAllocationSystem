// src/controllers/token.controller.ts

import {
    JsonController,
    Post,
    Body,
    Param,
    Get,
    HttpCode,
    Authorized,
    BadRequestError,
} from 'routing-controllers';
import { injectable, inject } from 'inversify';

import { AllocationService } from '../services/allocateService.js';
import { RequestTokenBody } from '../dto/request-token.dto.js';
import { TokenParam } from '../dto/token-param.dto.js';
import { SlotParam } from '../dto/slot-param.dto.js';
import { prisma } from '../repositories/prisma/client.js';
import type { Token } from 'generated/prisma/client.js';

@JsonController('/tokens')
export class TokenController {
    private allocationService = new AllocationService();
    constructor() { }

    /**
     * -------------------------
     * REQUEST / ALLOCATE TOKEN
     * -------------------------
     */
    @Post('/')
    @HttpCode(201)
    async requestToken(
        @Body() body: RequestTokenBody
    ) {
        const {
            name,
            phone,
            dob,
            doctorId,
            slotId,
            source,
            paymentStatus,
            isEmergency
        } = body;

        if (!name || !doctorId || !slotId || !source || !paymentStatus) {
            throw new BadRequestError('Missing required fields');
        }

        return await this.allocationService.requestToken({
            patient: {
                name,
                phone: phone ?? undefined,
                dob: dob ?? undefined,
            },
            doctorId,
            slotId,
            source,
            paymentStatus,
            isEmergency,
            requestedBy: 'SYSTEM' // later derive from auth context
        });
    }

    /**
     * -------------------------
     * CANCEL TOKEN
     * -------------------------
     */
    @Post('/:tokenId/cancel')
    @HttpCode(200)
    async cancelToken(
        @Param('tokenId') tokenId: string
    ) {
        if (!tokenId) throw new BadRequestError('Token ID required');

        await this.allocationService.cancelToken(tokenId, 'SYSTEM');
        return { message: 'Token cancelled successfully' };
    }

    /**
     * -------------------------
     * MARK NO-SHOW
     * -------------------------
     */
    @Post('/:tokenId/no-show')
    @HttpCode(200)
    async markNoShow(
        @Param('tokenId') tokenId: string
    ) {
        if (!tokenId) throw new BadRequestError('Token ID required');

        await this.allocationService.markNoShow(tokenId);
        return { message: 'Token marked as no-show' };
    }

    /**
     * -------------------------
     * EMERGENCY TOKEN
     * -------------------------
     */
    @Post('/emergency')
    @HttpCode(201)
    async emergencyToken(
        @Body() body: RequestTokenBody
    ) {
        if (!body.name || !body.doctorId || !body.slotId) {
            throw new BadRequestError('Missing required fields');
        }

        return await this.allocationService.requestToken({
            patient: {
                name: body.name,
                phone: body.phone,
                dob: body.dob
            },
            doctorId: body.doctorId,
            slotId: body.slotId,
            source: body.source,
            paymentStatus: body.paymentStatus,
            isEmergency: true,
            requestedBy: 'EMPLOYEE'
        });
    }

    /**
     * -------------------------
     * VIEW SLOT TOKENS
     * (For simulation/debug)
     * -------------------------
     */
    @Get('/slot/:slotId')
    @HttpCode(200)
    async getSlotTokens(
        @Param('slotId') slotId: string
    ) {
        if (!slotId) throw new BadRequestError('Slot ID required');

        return await prisma.token.findMany({
            where: { slotId },
            orderBy: { sequenceNumber: 'asc' }
        });
    }
}
