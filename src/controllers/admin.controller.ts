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

import { CreateDoctorBody } from '../dto/create-doctor.dto.js';
import { CreateEmployeeBody } from '../dto/create-employee.dto.js';

@JsonController('/admin')
export class AdminController {

  /**
   * -------------------------
   * CREATE DOCTOR
   * -------------------------
   */
  @Post('/doctors')
  @HttpCode(201)
  async createDoctor(@Body() body: CreateDoctorBody) {
    if (!body.name) {
      throw new BadRequestError('Doctor name is required');
    }

    const user = await prisma.user.create({
      data: {
        name: body.name,
        role: 'DOCTOR',
        doctor: {
          create: {
            specialization: body.specialization
          }
        }
      },
      include: { doctor: true }
    });

    return user;
  }

  /**
   * -------------------------
   * CREATE EMPLOYEE
   * -------------------------
   */
  @Post('/employees')
  @HttpCode(201)
  async createEmployee(@Body() body: CreateEmployeeBody) {
    if (!body.name) {
      throw new BadRequestError('Employee name is required');
    }

    const user = await prisma.user.create({
      data: {
        name: body.name,
        role: 'EMPLOYEE',
        employee: {
          create: {
            department: body.department,
            designation: body.designation
          }
        }
      },
      include: { employee: true }
    });

    return user;
  }
}
