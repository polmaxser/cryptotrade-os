import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: 'CryptoTrade OS API',
      version: '0.1.0',
      status: 'ok',
    };
  }
}
