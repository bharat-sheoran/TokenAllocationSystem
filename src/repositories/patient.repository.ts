import type { Patient } from "../generated/prisma/client.js";
import { prisma } from './prisma/client.js';
import type { CreatePatientInput } from "./types.js";

export class PatientRepository {

    async findByPhone(phone: string): Promise<Patient | null> {
        return await prisma.patient.findFirst({
            where: { phone }
        });
    }

    async createPatient(data: CreatePatientInput): Promise<Patient> {
        return await prisma.patient.create({
            data
        });
    }

}
