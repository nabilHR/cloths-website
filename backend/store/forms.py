from django import forms
from .models import Product, ProductImage, Category, SubCategory

class ProductForm(forms.ModelForm):
    category = forms.ModelChoiceField(
        queryset=Category.objects.all(),
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    subcategory = forms.ModelChoiceField(
        queryset=SubCategory.objects.none(),
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    description = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 5, 'class': 'form-control'})
    )
    sizes = forms.CharField(
        required=False,
        help_text="Enter sizes separated by commas (e.g., S,M,L,XL)",
        widget=forms.TextInput(attrs={
            'placeholder': 'S,M,L,XL',
            'class': 'form-control'
        })
    )
    
    class Meta:
        model = Product
        fields = [
            'name', 'slug', 'description', 'price', 'sale_price', 
            'image', 'category', 'subcategory', 'sizes', 'colors', 
            'in_stock', 'featured', 'sku'
        ]
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'slug': forms.TextInput(attrs={'class': 'form-control'}),
            'price': forms.NumberInput(attrs={'class': 'form-control'}),
            'sale_price': forms.NumberInput(attrs={'class': 'form-control'}),
            'colors': forms.TextInput(attrs={'class': 'form-control'}),
            'sku': forms.TextInput(attrs={'class': 'form-control'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # If we have an instance and a category is selected
        if self.instance.pk and self.instance.category:
            self.fields['subcategory'].queryset = SubCategory.objects.filter(
                category=self.instance.category
            )
        
        # If form is being initialized with data and category is present
        if 'category' in self.data:
            try:
                category_id = int(self.data.get('category'))
                self.fields['subcategory'].queryset = SubCategory.objects.filter(
                    category_id=category_id
                )
            except (ValueError, TypeError):
                pass

ProductImageFormSet = forms.inlineformset_factory(
    Product, 
    ProductImage,
    fields=['image', 'alt_text', 'is_feature'],  # Remove 'display_order' for now
    extra=3,
    widgets={
        'image': forms.ClearableFileInput(attrs={'class': 'form-control'}),
        'alt_text': forms.TextInput(attrs={'class': 'form-control'}),
        # Remove the display_order field
    }
)