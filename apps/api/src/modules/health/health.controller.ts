import { Controller, Get } from '@nestjs/common';
import { type HealthService } from './health.service';

import { Public } from '@/modules/auth/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }
}
