import { FindManyOptions, ObjectLiteral, Repository } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResult } from '../interfaces/api-response.interface';

export async function paginate<T extends ObjectLiteral>(
  repository: Repository<T>,
  query: PaginationQueryDto,
  options: FindManyOptions<T> = {},
): Promise<PaginatedResult<T>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const [data, total] = await repository.findAndCount({
    ...options,
    skip: (page - 1) * limit,
    take: limit,
  });
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
