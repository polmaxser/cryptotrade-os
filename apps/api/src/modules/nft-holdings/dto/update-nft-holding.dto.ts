import { PartialType } from '@nestjs/mapped-types';
import { CreateNftHoldingDto } from './create-nft-holding.dto';

export class UpdateNftHoldingDto extends PartialType(CreateNftHoldingDto) {}
