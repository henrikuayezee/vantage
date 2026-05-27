import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Org-wide task status, priority breakdown, and completion trend' })
  getOverview(@CurrentUser() user: JwtPayload) {
    return this.reports.getOverview(user.organizationId);
  }

  @Get('team')
  @ApiOperation({ summary: 'Per-member open and completed task counts' })
  getTeam(@CurrentUser() user: JwtPayload) {
    return this.reports.getTeam(user.organizationId);
  }

  @Get('projects')
  @ApiOperation({ summary: 'Per-project progress and overdue counts' })
  getProjects(@CurrentUser() user: JwtPayload) {
    return this.reports.getProjects(user.organizationId);
  }
}
