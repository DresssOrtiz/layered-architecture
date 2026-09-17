import { Controller, Dependencies, Get } from '@nestjs/common';
import { AppService } from '../business/app.service';

@Controller()
@Dependencies(AppService)
export class AppController {
  constructor(appService) {
    this.appService = appService;
  }

  @Get()
  getHello() {
    return this.appService.getHello();
  }
}
