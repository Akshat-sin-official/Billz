from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization_id', 'parent', 'color')
    list_filter = ('organization_id',)
    search_fields = ('name', 'organization_id')
    ordering = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'base_price', 'stock_quantity', 'is_active', 'organization_id')
    list_filter = ('is_active', 'category', 'organization_id', 'created_at')
    search_fields = ('name', 'sku', 'barcode', 'hsn_code', 'organization_id')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'category', 'organization_id')
        }),
        ('Product Codes', {
            'fields': ('sku', 'barcode', 'hsn_code', 'unit')
        }),
        ('Pricing', {
            'fields': ('base_price', 'wholesale_price', 'cost_price', 'tax_rate', 'is_loose')
        }),
        ('Inventory', {
            'fields': ('stock_quantity', 'low_stock_threshold', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )
