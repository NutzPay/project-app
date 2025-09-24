import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsArray, 
  IsOptional, 
  IsUrl,
  IsEnum,
  IsNumber,
  IsPositive,
  ArrayNotEmpty,
} from 'class-validator';
import { WebhookStatus } from '@prisma/client';

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://your-app.com/webhooks/nutzbeta' })
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiProperty({ 
    example: ['payment.created', 'payment.completed', 'webhook.test'],
    description: 'Array of event types this webhook should listen to'
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional({ 
    example: 3,
    description: 'Maximum number of retry attempts (default: 3)'
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxRetries?: number;
}

export class UpdateWebhookDto extends PartialType(CreateWebhookDto) {
  @ApiPropertyOptional({ enum: WebhookStatus })
  @IsOptional()
  @IsEnum(WebhookStatus)
  status?: WebhookStatus;
}