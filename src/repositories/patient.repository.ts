import type { Patient } from "../generated/prisma/client.js";
import { prisma } from './prisma/client.js';
import type { CreatePatientInput } from "./types.js";

export class PatientRepository {

    async findByPhone(phone: string): Promise<Patient | null> {
        return prisma.patient.findFirst({
            where: { phone }
        });
    }

    async createPatient(data: CreatePatientInput): Promise<Patient> {
        return prisma.patient.create({
            data
        });
    }

}
