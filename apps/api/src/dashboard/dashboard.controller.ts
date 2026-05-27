import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Role } from '@vantage/types';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('developer')
  getDeveloper(@CurrentUser() user: JwtPayload) {
    return this.dashboard.getDeveloperData(user.sub, user.organizationId);
  }

  @Get('pm')
  @Roles(Role.PROJECT_MANAGER, Role.ADMIN)
  getPm(@CurrentUser() user: JwtPayload) {
    return this.dashboard.getPmData(user.organizationId);
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  getAdmin(@CurrentUser() user: JwtPayload) {
    return this.dashboard.getAdminData(user.organizationId);
  }
}
