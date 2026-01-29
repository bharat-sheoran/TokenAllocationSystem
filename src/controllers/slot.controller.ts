import {
    JsonController,
    Post,
    Body,
    HttpCode,
    BadRequestError,
    Authorized
} from 'routing-controllers';
import { injectable } from 'inversify';
import { prisma } from '../repositories/prisma/client.js';

import { CreateSlotBody } from '../dto/create-slot.dto.js';

@JsonController('/slots')
export class SlotController {

    /**
     * -------------------------
     * CREATE OPD SLOT
     * -------------------------
     */
    @Post('/')
    @HttpCode(201)
    async createSlot(@Body() body: CreateSlotBody) {
        const {
            doctorId,
            slotDate,
            startTime,
            endTime,
            hardCapacity
        } = body;

        if (!doctorId || !slotDate || !startTime || !endTime || !hardCapacity) {
            throw new BadRequestError('Missing required fields');
        }

        // Ensure doctor exists
        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId }
        });

        if (!doctor) {
            throw new BadRequestError('Doctor not found');
        }

        // Build timestamps
        const start = new Date(`${slotDate}T${startTime}:00`);
        const end = new Date(`${slotDate}T${endTime}:00`);

        if (start >= end) {
            throw new BadRequestError('Invalid slot timing');
        }

        const slot = await prisma.opdSlot.create({
            data: {
                doctorId,
                slotDate: new Date(slotDate),
                startTime: start,
                endTime: end,
                hardCapacity
            }
        });

        return slot;
    }
}
