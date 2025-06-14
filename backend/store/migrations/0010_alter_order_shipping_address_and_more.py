# Generated by Django 4.2 on 2025-06-15 10:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0009_order_tax_orderitem_color_orderitem_price_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='shipping_address',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='order',
            name='shipping_city',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='order',
            name='shipping_country',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='order',
            name='shipping_postal_code',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]
