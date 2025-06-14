# Save as verify_categories.py in your Django project directory
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from store.models import Product, Category

# List all categories
categories = Category.objects.all()
print("=== Categories ===")
for cat in categories:
    print(f"Category ID: {cat.id}, Name: {cat.name}, Slug: {cat.slug}")
    
# Check products in each category
print("\n=== Products by Category ===")
for cat in categories:
    products = Product.objects.filter(category_id=cat.id)
    print(f"Category {cat.name} (ID: {cat.id}) has {products.count()} products:")
    for p in products[:5]:  # Show first 5
        print(f"  - {p.name} (ID: {p.id}, Slug: {p.slug})")