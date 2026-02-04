from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'business_name', 'is_staff', 'is_active', 'created_at')
    list_filter = ('is_staff', 'is_active', 'role', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'business_name', 'organization_id')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'last_login', 'password')
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Business Info', {'fields': ('business_name', 'organization_id', 'branch_id', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'created_at')}),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating a new user
            obj.set_password(obj.password)
        super().save_model(request, obj, form, change)
