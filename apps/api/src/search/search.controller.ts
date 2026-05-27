import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Role } from '@vantage/types';
import { SearchService } from './search.service';

@ApiTags('search')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @ApiQuery({ name: 'q', required: true })
  search(@CurrentUser() user: JwtPayload, @Query('q') q = '') {
    return this.searchService.search(user.organizationId, q, user.sub, user.role as Role);
  }
}
