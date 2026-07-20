import { PartialType } from '@nestjs/mapped-types';
import { CreateEconomicEventDto } from './create-economic-event.dto';

export class UpdateEconomicEventDto extends PartialType(CreateEconomicEventDto) {}
