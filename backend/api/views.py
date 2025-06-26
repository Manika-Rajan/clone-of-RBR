import json

import environ
import razorpay
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings

from .models import Order
from .serializers import OrderSerializer

env = environ.Env()

# you have to create .env file in same folder where you are using environ.Env()
# reading .env file which located in api folder
environ.Env.read_env()


@api_view (['POST'])
def start_payment(request):
    # request.data is coming from frontend
    amount = request.data.get('amount')

    if not amount or float(amount) <= 0:
        return Response({'error': 'Invalid amount'}, status=400)
    

    # setup razorpay client this is the client to whom user is paying money to (us)
    client = razorpay.Client(auth=(settings.RAZORPAY_PUBLIC_KEY, settings.RAZORPAY_SECRET_KEY))

    # create razorpay order
    # the amount will come in 'paise' that means if we pass 50 amount will become
    # 0.5 rupees that means 50 paise so we have to convert it in rupees. So, we will 
    # mumtiply it by 100 so it will be 50 rupees.
    payment = client.order.create({"amount": int(float(amount) * 100), 
                                   "currency": "INR", 
                                   "payment_capture": "1"})

    # we are saving an order with isPaid=False because we've just initialized the order
    # we haven't received the money we will handle the payment succes in next 
    # function
    order = Order.objects.create( 
                                 order_amount=amount, 
                                 order_payment_id=payment['id']
                                 order_product=request.data.get('product_name', '')  # Optional product name
                                )

    serializer = OrderSerializer(order)

    """order response will be 
    {'id': 17, 
    'order_date': '23 January 2021 03:28 PM', 
    'order_product': '**product name from frontend**', 
    'order_amount': '**product amount from frontend**', 
    'order_payment_id': 'order_G3NhfSWWh5UfjQ', # it will be unique everytime
    'isPaid': False}"""

    data = {
        "payment": payment,
        "order": serializer.data
    }
    return Response(data)


@api_view(['POST'])
def handle_payment_success(request):
    # request.data is coming from frontend
    res = json.loads(request.data["response"])

    """res will be:
    {'razorpay_payment_id': 'pay_G3NivgSZLx7I9e', 
    'razorpay_order_id': 'order_G3NhfSWWh5UfjQ', 
    'razorpay_signature': '76b2accbefde6cd2392b5fbf098ebcbd4cb4ef8b78d62aa5cce553b2014993c0'}
    this will come from frontend which we will use to validate and confirm the payment
    """

    ord_id = res.get('razorpay_order_id')
    raz_pay_id = res.get('razorpay_payment_id')
    raz_signature = res.get('razorpay_signature')
    
    if not all([ord_id, raz_pay_id, raz_signature]):
        return Response({'error': 'Missing payment details'}, status=400)


    # get order by payment_id which we've created earlier with isPaid=False
    try:
        order = Order.objects.get(order_payment_id=ord_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    # we will pass this whole data in razorpay client to verify the payment
    client = razorpay.Client(auth=(settings.RAZORPAY_PUBLIC_KEY, settings.RAZORPAY_SECRET_KEY))
    data = {
        'razorpay_order_id': ord_id,
        'razorpay_payment_id': raz_pay_id,
        'razorpay_signature': raz_signature
    }

    try:
        client.utility.verify_payment_signature(data)
        order.isPaid = True
        order.save()
        return Response({'message': 'payment successfully received!'})
    except razorpay.errors.SignatureVerificationError:
        return Response({'error': 'Payment verification failed'}, status=400)
