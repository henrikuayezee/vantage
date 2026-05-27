import { Module } from '@nestjs/common';
import { TasksController, MilestonesController, GanttController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TasksController, GanttController, MilestonesController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
