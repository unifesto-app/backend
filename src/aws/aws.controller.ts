import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AwsService } from './aws.service';

@Controller('aws')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  @Get('health')
  async getHealth() {
    return this.awsService.getInfrastructureHealth();
  }

  @Get('overview')
  async getOverview() {
    return this.awsService.getOverview();
  }

  @Get('compute')
  async getCompute() {
    return this.awsService.getCompute();
  }

  @Get('database')
  async getDatabase() {
    return this.awsService.getDatabase();
  }

  @Get('cache')
  async getCache() {
    return this.awsService.getCache();
  }

  @Get('storage')
  async getStorage() {
    return this.awsService.getStorage();
  }

  @Get('security')
  async getSecurity() {
    return this.awsService.getSecurity();
  }

  @Get('cost')
  async getCost() {
    return this.awsService.getCost();
  }
}
