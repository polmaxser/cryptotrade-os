import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getRoot', () => {
    it('should return API metadata', () => {
      expect(appController.getRoot()).toEqual({
        name: 'CryptoTrade OS API',
        version: '0.1.0',
        status: 'ok',
      });
    });
  });
});
