from django.db import models

class Order(models.Model):
    order_amount = models.FloatField()
    order_payment_id = models.CharField(max_length=100)
    order_product = models.CharField(max_length=200)
    isPaid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.order_payment_id} ({self.order_amount})"
