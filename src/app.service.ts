import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '© 2026 Unifesto Private Limited. All rights reserved.';
  }
}
