from django.contrib import admin
from django import forms
from django.urls import path
from django.utils.safestring import mark_safe
from .models import (
    Category, SubCategory, Product, ProductImage, 
    Order, OrderItem, Review, WishlistItem, UserProfile, Address
)
from . import views  # Make sure to import views here

# Product Admin with Tabbed Interface
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'is_feature', 'display_order']

class ProductAdminForm(forms.ModelForm):
    description = forms.CharField(widget=forms.Textarea(attrs={'rows': 5}))
    sizes = forms.CharField(
        required=False, 
        help_text="Enter sizes separated by commas (e.g., S,M,L,XL)",
        widget=forms.TextInput(attrs={'placeholder': 'S,M,L,XL'})
    )
    
    class Meta:
        model = Product
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make subcategory field dependent on category
        if 'category' in self.initial:
            category_id = self.initial['category']
            self.fields['subcategory'].queryset = SubCategory.objects.filter(
                category_id=category_id
            )
        else:
            self.fields['subcategory'].queryset = SubCategory.objects.none()
        
        # Add CSS classes for styling
        for field_name in self.fields:
            self.fields[field_name].widget.attrs.update({'class': 'admin-form-field'})

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    list_display = ('image_preview', 'name', 'price', 'sale_price', 'category', 'subcategory', 'in_stock', 'featured')
    list_display_links = ('image_preview', 'name')
    list_filter = ('category', 'subcategory', 'in_stock', 'featured')
    search_fields = ('name', 'description', 'sku')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ProductImageInline]
    save_on_top = True
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'price', 'sale_price', 'image')
        }),
        ('Categorization', {
            'fields': ('category', 'subcategory')
        }),
        ('Inventory', {
            'fields': ('in_stock', 'sizes', 'colors', 'sku')
        }),
        ('Display Options', {
            'fields': ('featured',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def image_preview(self, obj):
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" width="50" height="50" style="object-fit: cover;" />')
        return "No Image"
    image_preview.short_description = 'Image'
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields['description'].widget.attrs['style'] = 'width: 90%; height: 150px;'
        return form
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('create-product/', 
                self.admin_site.admin_view(views.product_create), 
                name='store_product_create'),
            path('fancy-upload/', 
                self.admin_site.admin_view(views.fancy_product_upload), 
                name='fancy_product_upload'),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_create_product_button'] = True
        extra_context['show_fancy_upload_button'] = True
        return super().changelist_view(request, extra_context=extra_context)
    
    class Media:
        js = ('admin/js/product_form.js',)
        css = {
            'all': ('admin/css/product_admin.css',)
        }

# Category Admin
class SubCategoryInline(admin.TabularInline):
    model = SubCategory
    extra = 1
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'subcategory_count', 'product_count')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [SubCategoryInline]
    
    def subcategory_count(self, obj):
        return obj.subcategories.count()
    subcategory_count.short_description = 'Subcategories'
    
    def product_count(self, obj):
        return Product.objects.filter(category=obj).count()
    product_count.short_description = 'Products'

# Register other models
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Review)
admin.site.register(WishlistItem)
admin.site.register(UserProfile)
admin.site.register(Address)