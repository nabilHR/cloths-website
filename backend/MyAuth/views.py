from django.shortcuts import render

# Create your views here.
# backend/accounts/views.py
from rest_framework import generics, permissions
from rest_framework.response import Response
from .serializers import RegisterSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]