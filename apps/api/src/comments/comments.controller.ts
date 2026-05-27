import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Role } from '@vantage/types';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private comments: CommentsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Param('taskId') taskId: string) {
    return this.comments.list(user.organizationId, taskId);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Body('body') body: string,
    @Body('mentionedUserIds') mentionedUserIds?: string[],
  ) {
    return this.comments.create(
      user.organizationId,
      taskId,
      body,
      user.sub,
      user.role as Role,
      mentionedUserIds,
    );
  }
}
