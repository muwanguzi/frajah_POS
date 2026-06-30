import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Product } from '../../database/entities/product.entity';
import { paginate } from '../../common/utils/pagination.util';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    const { data, total } = await this.productsService.findAll(
      Number(page),
      Number(limit),
      search,
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STORE_KEEPER)
  @ApiOperation({ summary: 'Create a product' })
  create(@Body() dto: Partial<Product>) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STORE_KEEPER)
  @ApiOperation({ summary: 'Update a product' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<Product>,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Deactivate a product' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    await this.productsService.deactivate(id);
    return { message: 'Product deactivated' };
  }
}
