"""
Management command to seed system permissions

Usage:
    python manage.py seed_permissions
"""

from django.core.management.base import BaseCommand
from core.models import Permission


class Command(BaseCommand):
    help = 'Seeds the database with system permissions'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding system permissions...')
        
        permissions_data = [
            # Invoice permissions
            {'code': 'invoice.view', 'name': 'View Invoices', 'module': 'invoice', 'action': 'view'},
            {'code': 'invoice.create', 'name': 'Create Invoices', 'module': 'invoice', 'action': 'create'},
            {'code': 'invoice.edit', 'name': 'Edit Invoices', 'module': 'invoice', 'action': 'edit'},
            {'code': 'invoice.delete', 'name': 'Delete Invoices', 'module': 'invoice', 'action': 'delete'},
            {'code': 'invoice.cancel', 'name': 'Cancel Invoices', 'module': 'invoice', 'action': 'cancel'},
            {'code': 'invoice.email', 'name': 'Email Invoices', 'module': 'invoice', 'action': 'email'},
            
            # Product permissions
            {'code': 'product.view', 'name': 'View Products', 'module': 'product', 'action': 'view'},
            {'code': 'product.create', 'name': 'Create Products', 'module': 'product', 'action': 'create'},
            {'code': 'product.edit', 'name': 'Edit Products', 'module': 'product', 'action': 'edit'},
            {'code': 'product.delete', 'name': 'Delete Products', 'module': 'product', 'action': 'delete'},
            {'code': 'product.manage_stock', 'name': 'Manage Product Stock', 'module': 'product', 'action': 'manage_stock'},
            
            # Customer permissions
            {'code': 'customer.view', 'name': 'View Customers', 'module': 'customer', 'action': 'view'},
            {'code': 'customer.create', 'name': 'Create Customers', 'module': 'customer', 'action': 'create'},
            {'code': 'customer.edit', 'name': 'Edit Customers', 'module': 'customer', 'action': 'edit'},
            {'code': 'customer.delete', 'name': 'Delete Customers', 'module': 'customer', 'action': 'delete'},
            
            # Report permissions
            {'code': 'report.view', 'name': 'View Reports', 'module': 'report', 'action': 'view'},
            {'code': 'report.export', 'name': 'Export Reports', 'module': 'report', 'action': 'export'},
            {'code': 'report.advanced', 'name': 'Advanced Reports', 'module': 'report', 'action': 'advanced'},
            
            # User management permissions
            {'code': 'user.view', 'name': 'View Users', 'module': 'user', 'action': 'view'},
            {'code': 'user.create', 'name': 'Create Users', 'module': 'user', 'action': 'create'},
            {'code': 'user.edit', 'name': 'Edit Users', 'module': 'user', 'action': 'edit'},
            {'code': 'user.delete', 'name': 'Delete Users', 'module': 'user', 'action': 'delete'},
            {'code': 'user.assign_roles', 'name': 'Assign User Roles', 'module': 'user', 'action': 'assign_roles'},
            
            # Role management permissions
            {'code': 'role.view', 'name': 'View Roles', 'module': 'role', 'action': 'view'},
            {'code': 'role.create', 'name': 'Create Roles', 'module': 'role', 'action': 'create'},
            {'code': 'role.edit', 'name': 'Edit Roles', 'module': 'role', 'action': 'edit'},
            {'code': 'role.delete', 'name': 'Delete Roles', 'module': 'role', 'action': 'delete'},
            
            # Branch management permissions
            {'code': 'branch.view', 'name': 'View Branches', 'module': 'branch', 'action': 'view'},
            {'code': 'branch.create', 'name': 'Create Branches', 'module': 'branch', 'action': 'create'},
            {'code': 'branch.edit', 'name': 'Edit Branches', 'module': 'branch', 'action': 'edit'},
            {'code': 'branch.delete', 'name': 'Delete Branches', 'module': 'branch', 'action': 'delete'},
            
            # Distributor management permissions
            {'code': 'distributor.manage', 'name': 'Manage Distributor', 'module': 'distributor', 'action': 'manage'},
            {'code': 'distributor.settings', 'name': 'Distributor Settings', 'module': 'distributor', 'action': 'settings'},
            
            # Settings permissions
            {'code': 'settings.view', 'name': 'View Settings', 'module': 'settings', 'action': 'view'},
            {'code': 'settings.edit', 'name': 'Edit Settings', 'module': 'settings', 'action': 'edit'},
            
            # Billing/POS permissions
            {'code': 'pos.access', 'name': 'Access POS Terminal', 'module': 'pos', 'action': 'access'},
            {'code': 'pos.discount', 'name': 'Apply Discounts', 'module': 'pos', 'action': 'discount'},
            {'code': 'pos.refund', 'name': 'Process Refunds', 'module': 'pos', 'action': 'refund'},
        ]
        
        created_count = 0
        updated_count = 0
        
        for perm_data in permissions_data:
            permission, created = Permission.objects.update_or_create(
                code=perm_data['code'],
                defaults={
                    'name': perm_data['name'],
                    'module': perm_data['module'],
                    'action': perm_data['action'],
                    'is_system': True,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created: {permission.code}'))
            else:
                updated_count += 1
                self.stdout.write(f'  Updated: {permission.code}')
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Seeding complete!'))
        self.stdout.write(f'  Created: {created_count} permissions')
        self.stdout.write(f'  Updated: {updated_count} permissions')
        self.stdout.write(f'  Total: {Permission.objects.count()} permissions in database')
