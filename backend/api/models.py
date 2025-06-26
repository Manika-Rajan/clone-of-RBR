from django.db import models

# Create your models here.
class Order(models.Model):
    order_product = models.CharField(max_length=100, blank=True, null=True)  # Made optional
    order_amount = models.DecimalField(max_digits=10, decimal_places=2)  # Better for monetary values
    order_payment_id = models.CharField(max_length=100, unique=True)
    isPaid = models.BooleanField(default=False)
    order_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_product
