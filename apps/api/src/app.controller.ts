import { Controller, Get } from '@nestjs/common';
import { type AppService } from './app.service';

import { Public } from './modules/auth/decorators/public.decorator';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return this.appService.getRoot();
  }
}
