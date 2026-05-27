import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Role, TaskStatus } from '@vantage/types';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  create(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(
      user.organizationId,
      projectId,
      dto,
      user.sub,
      user.role as Role,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List tasks for a project' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'milestoneId', required: false })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'] })
  list(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('milestoneId') milestoneId?: string,
    @Query('overdue') overdue?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    return this.tasks.list(user.organizationId, projectId, user.sub, user.role as Role, {
      status,
      priority,
      assigneeId,
      milestoneId,
      overdue: overdue === 'true',
      search,
      sortBy,
      sortDir: (sortDir as 'asc' | 'desc') ?? 'asc',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  getById(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.tasks.getById(user.organizationId, id, user.sub, user.role as Role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(user.organizationId, id, dto, user.sub, user.role as Role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.tasks.delete(user.organizationId, id, user.sub, user.role as Role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
  ) {
    return this.tasks.updateStatus(
      user.organizationId,
      id,
      status,
      user.sub,
      user.role as Role,
    );
  }

  @Patch(':id/position')
  @ApiOperation({ summary: 'Update task position (Kanban ordering)' })
  updatePosition(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('position') position: number,
  ) {
    return this.tasks.updatePosition(
      user.organizationId,
      id,
      position,
      user.sub,
      user.role as Role,
    );
  }

  @Get(':id/subtasks')
  @ApiOperation({ summary: 'Get subtasks of a task' })
  getSubTasks(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.tasks.getSubTasks(user.organizationId, id, user.sub, user.role as Role);
  }

  @Post(':id/dependencies')
  @ApiOperation({ summary: 'Add a task dependency' })
  addDependency(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('dependsOnTaskId') dependsOnTaskId: string,
  ) {
    return this.tasks.addDependency(
      user.organizationId,
      id,
      dependsOnTaskId,
      user.sub,
      user.role as Role,
    );
  }

  @Delete(':id/dependencies/:dependsOnTaskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a task dependency' })
  async removeDependency(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('dependsOnTaskId') dependsOnTaskId: string,
  ) {
    await this.tasks.removeDependency(
      user.organizationId,
      id,
      dependsOnTaskId,
      user.sub,
      user.role as Role,
    );
  }
}

@ApiTags('gantt')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId')
export class GanttController {
  constructor(private tasks: TasksService) {}

  @Get('gantt')
  @ApiOperation({ summary: 'Get Gantt chart data (tasks with dates + milestones)' })
  getGanttData(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.tasks.getGanttData(
      user.organizationId,
      projectId,
      user.sub,
      user.role as Role,
    );
  }
}

@ApiTags('milestones')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/milestones')
export class MilestonesController {
  constructor(private tasks: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List milestones for a project' })
  list(@CurrentUser() user: JwtPayload, @Param('projectId') projectId: string) {
    return this.tasks.listMilestones(
      user.organizationId,
      projectId,
      user.sub,
      user.role as Role,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a milestone' })
  create(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.tasks.createMilestone(
      user.organizationId,
      projectId,
      dto,
      user.sub,
      user.role as Role,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a milestone' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.tasks.updateMilestone(user.organizationId, id, dto, user.sub, user.role as Role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a milestone' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.tasks.deleteMilestone(user.organizationId, id, user.sub, user.role as Role);
  }
}
