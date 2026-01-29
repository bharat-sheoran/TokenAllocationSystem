import type { OpdSlot } from "../generated/prisma/client.js";
import { prisma } from './prisma/client.js';

export class SlotRepository {
  async getById(slotId: string): Promise<OpdSlot | null>{
    return await prisma.opdSlot.findUnique({
      where: { id: slotId }
    });
  }

  async lockSlot(slotId: string): Promise<void> {
    await await prisma.$executeRawUnsafe(
      `SELECT 1 FROM "OpdSlot" WHERE id = $1 FOR UPDATE`,
      slotId
    );
  }

  async countConfirmedTokens(slotId: string): Promise<number> {
    return await prisma.token.count({
      where: {
        slotId,
        status: 'CONFIRMED'
      }
    });
  }
}