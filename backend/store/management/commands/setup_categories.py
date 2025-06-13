from django.core.management.base import BaseCommand
from store.models import Category, SubCategory

class Command(BaseCommand):
    help = 'Set up standard e-commerce categories'

    def handle(self, *args, **kwargs):
        # Clear existing categories (optional - be careful in production!)
        self.stdout.write('Clearing existing categories...')
        Category.objects.all().delete()
        
        # Create main categories
        self.stdout.write('Creating main categories...')
        men = Category.objects.create(name="Men", slug="men")
        women = Category.objects.create(name="Women", slug="women")
        kids = Category.objects.create(name="Kids", slug="kids")
        
        # Create subcategories for Men
        self.stdout.write('Creating subcategories for Men...')
        men_subcats = [
            ("T-shirts", "men-tshirts"),
            ("Shirts", "men-shirts"),
            ("Jeans", "men-jeans"),
            ("Trousers", "men-trousers"),
            ("Suits", "men-suits"),
            ("Jackets", "men-jackets"),
            ("Activewear", "men-activewear"),
            ("Underwear", "men-underwear"),
        ]
        
        for name, slug in men_subcats:
            SubCategory.objects.create(name=name, slug=slug, category=men)
        
        # Create subcategories for Women
        self.stdout.write('Creating subcategories for Women...')
        women_subcats = [
            ("Dresses", "women-dresses"),
            ("Tops", "women-tops"),
            ("Blouses", "women-blouses"),
            ("Jeans", "women-jeans"),
            ("Skirts", "women-skirts"),
            ("Activewear", "women-activewear"),
            ("Lingerie", "women-lingerie"),
            ("Jackets", "women-jackets"),
        ]
        
        for name, slug in women_subcats:
            SubCategory.objects.create(name=name, slug=slug, category=women)
        
        # Create subcategories for Kids
        self.stdout.write('Creating subcategories for Kids...')
        kids_subcats = [
            ("Boys", "kids-boys"),
            ("Girls", "kids-girls"),
            ("Baby", "kids-baby"),
            ("School Uniforms", "kids-school-uniforms"),
            ("Accessories", "kids-accessories"),
        ]
        
        for name, slug in kids_subcats:
            SubCategory.objects.create(name=name, slug=slug, category=kids)
        
        self.stdout.write(self.style.SUCCESS('Successfully created standard categories'))