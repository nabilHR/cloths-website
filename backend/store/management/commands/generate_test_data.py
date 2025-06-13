from django.core.management.base import BaseCommand
from store.models import Product, Category
import random
from django.utils.text import slugify
from decimal import Decimal

class Command(BaseCommand):
    help = 'Generate test products'

    def add_arguments(self, parser):
        parser.add_argument('count', type=int, help='Number of products to generate')

    def handle(self, *args, **options):
        count = options['count']
        
        # Make sure we have categories
        categories = list(Category.objects.all())
        if not categories:
            self.stdout.write('Creating test categories...')
            categories = []
            for i in range(5):
                name = f"Test Category {i+1}"
                category = Category.objects.create(
                    name=name,
                    slug=slugify(name)
                )
                categories.append(category)
        
        # Generate products
        self.stdout.write(f'Generating {count} test products...')
        for i in range(count):
            name = f"Test Product {i+1}"
            price = Decimal(str(round(random.uniform(9.99, 99.99), 2)))
            category = random.choice(categories)
            
            Product.objects.create(
                name=name,
                slug=slugify(name),
                description=f"This is a test product description for {name}",
                price=price,
                category=category,
                # Don't include image as it's required in your model but we don't have test images
                # Adjust any other required fields based on your model
            )
            
            if (i+1) % 100 == 0:
                self.stdout.write(f'Created {i+1} products...')
        
        self.stdout.write(self.style.SUCCESS(f'Successfully generated {count} test products'))