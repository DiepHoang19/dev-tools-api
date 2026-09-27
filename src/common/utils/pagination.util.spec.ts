import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { paginate } from './pagination.util';

interface TestItem {
  id: string;
}

describe('paginate', () => {
  it('applies skip/take and returns the shared response envelope', async () => {
    const data: TestItem[] = [{ id: 'item-11' }, { id: 'item-12' }];
    const findAndCount = jest.fn().mockResolvedValue([data, 22]);
    const repository = {
      findAndCount,
    } as unknown as Repository<TestItem>;
    const query = Object.assign(new PaginationQueryDto(), {
      page: 2,
      limit: 10,
    });

    await expect(
      paginate(
        repository,
        query,
        { order: { id: 'ASC' } },
        'Items retrieved successfully',
      ),
    ).resolves.toEqual({
      data,
      pagination: {
        page: 2,
        limit: 10,
        total: 22,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      },
      statusCode: 200,
      message: 'Items retrieved successfully',
    });
    expect(findAndCount).toHaveBeenCalledWith({
      order: { id: 'ASC' },
      skip: 10,
      take: 10,
    });
  });

  it('handles an empty first page', async () => {
    const repository = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    } as unknown as Repository<TestItem>;

    await expect(
      paginate(repository, new PaginationQueryDto()),
    ).resolves.toMatchObject({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });
});
