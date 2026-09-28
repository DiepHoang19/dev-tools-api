import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Category, Product],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  ssl: { rejectUnauthorized: false },
});

async function seed(): Promise<void> {
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const categoryRepository = dataSource.getRepository(Category);
  const productRepository = dataSource.getRepository(Product);

  let admin = await userRepository.findOneBy({ user_name: 'admin' });
  if (!admin) {
    admin = await userRepository.save(
      userRepository.create({
        user_name: 'admin',
        password: await bcrypt.hash('Admin123!', 10),
      }),
    );
  }

  const categorySeeds = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
    },
    {
      name: 'Books',
      slug: 'books',
      description: 'Printed and digital books',
    },
    {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Products for everyday living',
    },
  ];

  const categories = new Map<string, Category>();
  for (const item of categorySeeds) {
    let category = await categoryRepository.findOneBy({ slug: item.slug });
    if (!category) {
      category = await categoryRepository.save(categoryRepository.create(item));
    }
    categories.set(item.slug, category);
  }

  const productSeeds = [
    {
      name: 'Mechanical Keyboard',
      sku: 'KEYBOARD-001',
      description: 'Hot-swappable mechanical keyboard',
      price: 129.99,
      stock: 25,
      categoryId: categories.get('electronics')!.id,
    },
    {
      name: 'Wireless Mouse',
      sku: 'MOUSE-001',
      description: 'Ergonomic wireless mouse',
      price: 49.9,
      stock: 50,
      categoryId: categories.get('electronics')!.id,
    },
    {
      name: 'Clean Code',
      sku: 'BOOK-001',
      description: 'A handbook of agile software craftsmanship',
      price: 35,
      stock: 15,
      categoryId: categories.get('books')!.id,
    },
  ];

  for (const item of productSeeds) {
    if (!(await productRepository.existsBy({ sku: item.sku }))) {
      await productRepository.save(productRepository.create(item));
    }
  }

  console.log(
    `Seed completed: user=${admin.user_name}, categories=${categorySeeds.length}, products=${productSeeds.length}`,
  );
  await dataSource.destroy();
}

seed().catch(async (error: unknown) => {
  console.error('Seed failed', error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exitCode = 1;
});
