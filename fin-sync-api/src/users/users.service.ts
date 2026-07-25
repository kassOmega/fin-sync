import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Get logged in user's profile
  async getMyProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Owner creates a staff member and assigns them to a company
  async createStaff(dto: CreateStaffDto, ownerId: number) {
    // 1. Verify the Owner actually owns the company they are assigning to
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (company.ownerId !== ownerId)
      throw new ForbiddenException('You do not own this company');

    // 2. Check if email is already in use
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 4. Use a transaction to create the User AND the CompanyMember link simultaneously
    return this.prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          phone: dto.phone,
          role: dto.role,
        },
        select: { id: true, name: true, email: true, phone: true, role: true },
      });

      const memberLink = await prisma.companyMember.create({
        data: {
          userId: newUser.id,
          companyId: dto.companyId,
          role: dto.role,
        },
      });

      return { user: newUser, companyAssignment: memberLink };
    });
  }

  // Owner updates staff details/role
  async updateStaff(userId: number, dto: UpdateUserDto, ownerId: number) {
    const userToUpdate = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userToUpdate) throw new NotFoundException('User not found');

    // Prevent Owner from editing another Owner (optional safety measure)
    if (userToUpdate.role === SystemRole.Owner) {
      throw new ForbiddenException('Cannot edit other owners');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
  }

  // Owner deletes a staff member
  async deleteStaff(userId: number, ownerId: number) {
    const userToDelete = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userToDelete) throw new NotFoundException('User not found');
    if (userToDelete.role === SystemRole.Owner)
      throw new ForbiddenException('Cannot delete owners');

    // Prisma will automatically cascade delete their CompanyMember links if set up in schema
    return this.prisma.user.delete({ where: { id: userId } });
  }
}
