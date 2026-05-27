import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@vantage/types';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projects: ProjectsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Create a project (Admin / PM)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.organizationId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List projects (Developers see only their projects)' })
  list(@CurrentUser() user: JwtPayload) {
    return this.projects.list(user.organizationId, user.sub, user.role as Role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.projects.getById(user.organizationId, id, user.sub, user.role as Role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(user.organizationId, id, dto, user.sub, user.role as Role);
  }

  @Patch(':id/archive')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Archive a project (Admin / PM)' })
  archive(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.projects.archive(user.organizationId, id, user.sub, user.role as Role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project (Admin only)' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.projects.delete(user.organizationId, id);
  }

  @Post(':id/members')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ApiOperation({ summary: 'Add a member to a project' })
  addMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.projects.addMember(user.organizationId, id, dto, user.sub, user.role as Role);
  }

  @Delete(':id/members/:userId')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a project' })
  async removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
  ) {
    await this.projects.removeMember(
      user.organizationId,
      id,
      targetUserId,
      user.sub,
      user.role as Role,
    );
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get project task stats (progress %, counts by status)' })
  getStats(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.projects.getStats(user.organizationId, id, user.sub, user.role as Role);
  }
}
