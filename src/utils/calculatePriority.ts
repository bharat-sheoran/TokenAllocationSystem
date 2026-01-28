// src/services/priority.util.ts
import { TokenSource, PaymentStatus } from "../generated/prisma/enums.js";

interface CalculatePriorityInput {
    source: TokenSource;
    paymentStatus: PaymentStatus;
    isEmergency?: boolean;
}

export function calculatePriority({
    source,
    paymentStatus,
    isEmergency = false
}: CalculatePriorityInput): number {

    // Absolute override
    if (isEmergency) {
        return 1000;
    }

    let score = 0;

    // Payment-based priority
    if (paymentStatus === PaymentStatus.PAID) {
        score += 300;
    }

    // Source-based priority
    switch (source) {
        case TokenSource.FOLLOW_UP:
            score += 200;
            break;

        case TokenSource.WALK_IN:
            score += 100;
            break;

        case TokenSource.ONLINE:
            score += 50;
            break;

        case TokenSource.EMERGENCY:
            // Redundant safety
            score += 1000;
            break;
    }

    return score;
}
