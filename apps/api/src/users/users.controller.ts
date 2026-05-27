import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@vantage/types';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  // ─── Own profile ──────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.users.getProfile(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile or change password' })
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.sub, dto);
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER)
  @ApiOperation({ summary: 'List all users in organization (Admin / PM)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listUsers(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.users.listUsers(user.organizationId, page, Math.min(limit, 100));
  }

  @Post('invite')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Invite a user to the organization (Admin only)' })
  async inviteUser(@CurrentUser() user: JwtPayload, @Body() dto: InviteUserDto) {
    const profile = await this.users.getProfile(user.sub);
    const inviterName = `${profile.firstName} ${profile.lastName}`;
    await this.users.inviteUser(user.organizationId, dto, inviterName);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user role or active status (Admin only)' })
  updateUser(
    @CurrentUser() user: JwtPayload,
    @Param('id') targetId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.updateUser(user.organizationId, targetId, dto, user.sub);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user from the organization (Admin only)' })
  deleteUser(@CurrentUser() user: JwtPayload, @Param('id') targetId: string) {
    return this.users.deleteUser(user.organizationId, targetId, user.sub);
  }
}
