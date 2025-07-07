from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_payment_id', 'order_amount', 'order_product', 'isPaid', 'created_at']
    list_filter = ['isPaid', 'created_at']
    search_fields = ['order_payment_id', 'order_product']
    fields = ['order_payment_id', 'order_amount', 'order_product', 'isPaid', 'created_at']
    readonly_fields = ['created_at']