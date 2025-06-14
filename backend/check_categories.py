# Save as check_categories.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from store.models import Category, SubCategory

print("=== CATEGORIES ===")
for cat in Category.objects.all():
    print(f"ID: {cat.id}, Name: {cat.name}, Slug: {cat.slug}")

print("\n=== SUBCATEGORIES ===")
for subcat in SubCategory.objects.all():
    print(f"ID: {subcat.id}, Name: {subcat.name}, Slug: {subcat.slug}, Category: {subcat.category.name}")