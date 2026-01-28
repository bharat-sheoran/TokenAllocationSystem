import { TokenSource, PaymentStatus } from '../generated/prisma/client.js';

export class RequestTokenBody {
    name!: string;
    phone?: string;
    dob?: Date;

    doctorId!: string;
    slotId!: string;

    source!: TokenSource;
    paymentStatus!: PaymentStatus;
    isEmergency?: boolean;
}
