import os
import django
from django.db.models import Q

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from store.models import Category, SubCategory, Product

# COMPLETE CLEANUP - Delete ALL existing categories and subcategories
print("🔄 Performing complete category cleanup...")
SubCategory.objects.all().delete()
print("✓ All subcategories removed")

# Uncomment this to delete ALL categories
Category.objects.all().delete()
print("✓ All categories removed")

# Create ONLY the three main categories with simple slugs
categories = [
    {"name": "Men", "slug": "men"},
    {"name": "Women", "slug": "women"},
    {"name": "Kids", "slug": "kids"}
]

created_categories = {}

for cat_data in categories:
    cat, created = Category.objects.update_or_create(
        slug=cat_data["slug"],
        defaults={"name": cat_data["name"]}
    )
    status = "Created" if created else "Updated"
    print(f"✓ {status} category: {cat.name} (slug: {cat.slug}, ID: {cat.id})")
    created_categories[cat_data["slug"]] = cat

# Display summary
print("\n✅ CATEGORY STRUCTURE REBUILT SUCCESSFULLY")
print("==================================")
print("Your store now has ONLY 3 main categories:")

for category in Category.objects.all():
    print(f"• {category.name} (ID: {category.id}, slug: {category.slug})")

# Update orphaned products to Men category as default
men_category = created_categories["men"]
orphaned_products = Product.objects.filter(
    Q(category__isnull=True) | 
    ~Q(category__in=Category.objects.all())
)

if orphaned_products.exists():
    print(f"\n⚠️ Found {orphaned_products.count()} products without a valid category.")
    print(f"Assigning all orphaned products to the Men category (ID: {men_category.id}).")
    orphaned_products.update(category=men_category)
    print(f"✓ Updated {orphaned_products.count()} products.")