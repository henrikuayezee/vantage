import { Controller, Get, Patch, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.notifications.findAll(user.organizationId, user.sub);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notifications.getUnreadCount(user.organizationId, user.sub);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notifications.markRead(user.organizationId, user.sub, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.organizationId, user.sub);
  }
}
