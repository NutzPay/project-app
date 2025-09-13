import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(@Body() createApiKeyDto: CreateApiKeyDto) {
    // Converte expiresAt de string para Date (se vier definido)
    const payload = {
      ...createApiKeyDto,
      expiresAt: createApiKeyDto.expiresAt
        ? new Date(createApiKeyDto.expiresAt)
        : undefined,
    };

    return this.apiKeysService.create(payload);
  }

  @Get()
  async findAll() {
    return this.apiKeysService.findAll();
  }
}

