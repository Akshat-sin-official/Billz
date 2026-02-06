from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .invoice_views import InvoiceViewSet

router = DefaultRouter()
router.register(r'', InvoiceViewSet, basename='invoice')

urlpatterns = router.urls
