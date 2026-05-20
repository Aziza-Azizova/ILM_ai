import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Get('me/stats')
  getStats(@CurrentUser() user: User) {
    return this.usersService.getStats(user.id);
  }

  @Patch('me/goal')
  updateGoal(
    @CurrentUser() user: User,
    @Body() body: { goalText?: string; goalDate?: string },
  ) {
    return this.usersService.updateGoal(user.id, body);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: User,
    @Body() body: { name?: string; reminderTime?: string },
  ) {
    return this.usersService.updateProfile(user.id, body);
  }
}
