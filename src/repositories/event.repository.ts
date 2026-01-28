import type { EventEntityType } from '../generated/prisma/enums.js';
import { prisma } from './prisma/client.js';
import { Prisma } from '../generated/prisma/client.js';

export interface CreateEventInput {
    entityType: EventEntityType;
    entityId: string;

    eventType: string;
    eventPayload?: Prisma.InputJsonValue;

    actorId?: string;
}

export class EventRepository {
    async appendEvent(input: CreateEventInput) {
        const data: Prisma.EventCreateInput = {
            entityType: input.entityType,
            entityId: input.entityId,
            eventType: input.eventType,
            ...(input.eventPayload !== undefined && {
                eventPayload: input.eventPayload
            }),

            ...(input.actorId !== undefined && {
                actor: { connect: { id: input.actorId } }
            })
        };

        await prisma.event.create({ data });
    }
}